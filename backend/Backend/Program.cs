using Backend.Data;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.IdentityModel.Tokens;
using OpenAI;
using System.Text;
using Backend.Auth;
using Backend.Hubs;
using Backend.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ApplicationContext>(options =>
{
    options
        .UseNpgsql(builder.Configuration.GetConnectionString("Database"), action => action.UseVector())
        .UseProjectables();
    options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
});

builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = true;
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
        policy
            .WithOrigins(builder.Configuration["Frontend:Url"]!)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

builder.Services
    .AddIdentityCore<User>(options => 
    {
        options.User.RequireUniqueEmail = true;
    })
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<ApplicationContext>()
    .AddDefaultTokenProviders();
    
builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
    options.TokenLifespan = TimeSpan.FromMinutes(30));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            ValidateLifetime = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SecretKey"]!)),
            ValidateIssuerSigningKey = true,
            ClockSkew = TimeSpan.Zero
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;

                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/chatHub"))
                    context.Token = accessToken;

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminIfUserIsAdmin", policy => policy.Requirements.Add(new AdminIfUserIsAdminRequirement()));
    options.AddPolicy("ApplicantVisibility", policy => policy.Requirements.Add(new ApplicantVisibilityRequirement()));
    options.AddPolicy("ChatMessageSender", policy => policy.Requirements.Add(new ChatMessageSenderRequirement()));
    options.AddPolicy("ChatParticipantOrAdmin", policy => policy.Requirements.Add(new ChatParticipantOrAdminRequirement()));
    options.AddPolicy("PostOwnerOrAdmin", policy => policy.Requirements.Add(new PostOwnerOrAdminRequirement()));
    options.AddPolicy("ReviewOwnerOrAdmin", policy => policy.Requirements.Add(new ReviewOwnerOrAdminRequirement()));
    options.AddPolicy("SameUserOrAdmin", policy => policy.Requirements.Add(new SameUserOrAdminRequirement()));
});
    
OpenAIClient openAIClient = new OpenAIClient(builder.Configuration["OpenAI:Key"]!);
builder.Services.AddSingleton(openAIClient);

builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddTransient<IAuthorizationHandler, AdminIfUserIsAdminAuthorizationHandler>();
builder.Services.AddTransient<IAuthorizationHandler, ApplicantVisibilityAuthorizationHandler>();
builder.Services.AddTransient<IAuthorizationHandler, ChatMessageSenderAuthorizationHandler>();
builder.Services.AddTransient<IAuthorizationHandler, ChatParticipantOrAdminAuthorizationHandler>();
builder.Services.AddTransient<IAuthorizationHandler, PostOwnerOrAdminAuthorizationHandler>();
builder.Services.AddTransient<IAuthorizationHandler, ReviewOwnerOrAdminAuthorizationHandler>();
builder.Services.AddTransient<IAuthorizationHandler, SameUserOrAdminAuthorizationHandler>();

builder.Services.AddTransient<IApplicantRepository, ApplicantRepository>();
builder.Services.AddTransient<IChatRepository, ChatRepository>();
builder.Services.AddTransient<IEmployerRepository, EmployerRepository>();
builder.Services.AddTransient<IEntityQueryRepository, EntityQueryRepository>();
builder.Services.AddTransient<IJobPostRepository, JobPostRepository>();
builder.Services.AddTransient<IUserRepository, UserRepository>();
builder.Services.AddTransient<IReviewRepository, ReviewRepository>();
builder.Services.AddTransient<ISkillRepository, SkillRepository>();
builder.Services.AddTransient<IUnitOfWork, UnitOfWork>();

builder.Services.AddTransient<IAiService, AiService>();
builder.Services.AddTransient<IAuthService, AuthService>();
builder.Services.AddTransient<IChatService, ChatService>();
builder.Services.AddTransient<IDiscoverService, DiscoverService>();
builder.Services.AddTransient<IEmailService, EmailService>();
builder.Services.AddTransient<IJobApplicationService, JobApplicationService>();
builder.Services.AddTransient<IJobPostService, JobPostService>();
builder.Services.AddTransient<IReviewService, ReviewService>();
builder.Services.AddTransient<ISkillService, SkillService>();
builder.Services.AddTransient<IUserService, UserService>();

builder.Services.AddSwaggerGen(options =>
{
    options.CustomSchemaIds(type => type.FullName?.Replace(".", "_"));
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseExceptionHandler();
app.UseHttpsRedirection();
app.UseCors("CorsPolicy");
app.UseStatusCodePages();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/chatHub", options =>
{
    options.TransportMaxBufferSize = 0;
});

app.Run();
