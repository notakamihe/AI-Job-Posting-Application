import Straightforward from "@/components/icons/Straightforward";
import EntitySearch from "@/components/EntitySearch";
import Link from "next/link";
import { FaBrain } from "react-icons/fa6";
import { HiChatAlt2 } from "react-icons/hi";
import { cachedGetAuthUser } from "@/actions/api/user";
import HomePageRouterRefresher from "./components/HomePageRouterRefresher";

export default async function HomePage() {
  const user = await cachedGetAuthUser();

  return (
    <div>
      <HomePageRouterRefresher />
      <div className="relative bg-primary/20">
        <div className="absolute inset-0 flex flex-col justify-center items-center p-10">
          <h1 className="w-8/10 text-center text-[max(1.35rem,4vw)] leading-tight font-black bg-linear-to-r from-blue-600 to-primary text-transparent bg-clip-text">
            Where the Best Work Opportunities Meet the Right Talent.
          </h1>
          <div className="absolute top-full w-full px-5 mt-5 md:static md:w-8/10 md:px-0">
            <EntitySearch 
              className="md:bg-base-100/75 md:border-base-100/75 md:outline-0! md:shadow-none md:text-primary"
              numResults={5}
            />
          </div>
        </div>
        <img alt="Hero background" className="w-full" src="/static/images/hero.png" />
      </div>
      <div className="flex gap-7 mt-20 mb-10 px-10 flex-wrap md:mt-10">
        <div className="flex-1 flex flex-col justify-center items-center rounded text-center min-w-60">
          <Straightforward className="text-primary text-5xl! mb-1" />
          <h2 className="text-xl font-bold mb-2 text-primary">Streamlined Approach</h2>
          <p className="text-center">
            Allows for the most intuitive and straightforward experience possible. Post, apply, and message quickly and without hassle.
          </p>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center rounded text-center min-w-60">
          <HiChatAlt2 className="text-3xl text-primary" />
          <h2 className="text-xl font-bold mb-2 text-primary">Supportive Network</h2>
          <p className="text-center">
            Engage with employers, recruiters, and talent in a space designed for building meaningful professional connections.
          </p>
        </div>
        <div className="flex-1 flex flex-col justify-center items-center rounded text-center min-w-60">
          <FaBrain className="text-xl mb-1.5 text-primary" />
          <h2 className="text-xl/5 font-bold mb-2 text-primary">Intelligent Recommendations</h2>
          <p className="text-center">
            Delivers results tailored to you with the help of AI so that you are provided with the most relevant opportunities.
          </p>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row bg-primary items-center pt-5 lg:pt-0">
        <div className="px-15 pt-5 lg:pb-5 text-white">
          <h2 className="text-3xl font-bold mb-3 text-center lg:text-left">For job seekers</h2>
          <p className="text-center lg:text-left">
            Finding the right opportunity shouldn't feel overwhelming. Our platform makes it simple to 
            discover roles that match your skills, interests, and career goals. Build a profile that 
            stands out and connect directly with employers. Whether you're starting fresh or taking the 
            next step forward, we'll help you land the job you deserve.
          </p>
        </div>
        <img 
          alt="An employer" 
          className="w-4/10 rounded-lg top-0 shrink-0 translate-y-8" 
          src="/static/images/interviewee.png" 
        />
      </div>
      <div className="flex flex-col-reverse lg:flex-row bg-primary/15 items-center pt-5 lg:pt-0">
        <img 
          alt="An employer" 
          className="w-4/10 rounded-lg top-0 shrink-0 translate-y-8" 
          src="/static/images/employer.png" 
        />
        <div className="px-15 pt-5 lg:pb-5 text-primary">
          <h2 className="text-3xl font-bold mb-3 text-center lg:text-left">For employers</h2>
          <p className="text-center lg:text-left">
            Finding the right talent shouldn't be complicated. Our platform makes it easy to connect 
            with qualified candidates who have the skills, experience, and drive your team needs. 
            Post jobs, view applications, and discover professionals who are ready to contribute 
            to your company's success. Whether you're filling one role or building a team, we’ll help 
            you hire with confidence.
          </p>
        </div>
      </div>
      <div className="py-25 px-10 bg-base-100">
        <h2 className="text-3xl text-center font-medium mb-5">
          Take the next step in your professional development today!
        </h2>
        <div className="text-center">
          <Link className="btn btn-primary" href={user ? "/discover" : "/register"}>Get started</Link>
        </div>
      </div>
    </div>
  );
}
