"use client"

import { deleteUser, unfollowEmployer } from "@/actions/api/user";
import EmployerCard from "@/components/EmployerCard";
import EmptyResume from "@/components/icons/EmptyResume";
import ReadyToWork from "@/components/icons/ReadyToWork";
import { ApplicantDetail, AuthenticatedUser, Chat, Employer } from "@/types";
import { trimLink, getMonthString } from "@/utils/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FaBriefcase, FaChevronRight, FaGithub, FaGlobe, FaLinkedin, FaUserMinus } from "react-icons/fa";
import { FaLocationDot, FaMessage, FaPencil, FaXTwitter, FaLock, FaGraduationCap, FaXmark, FaTrash } from "react-icons/fa6";
import { PiCertificateFill } from "react-icons/pi";
import { RiUserShared2Fill } from "react-icons/ri";

function LinkIcon(props: { className: string; link: string | null; }) {
  if (props.link) {
    if (props.link.includes("linkedin.com"))
      return <FaLinkedin className={props.className} />
    else if (props.link.includes("x.com"))
      return <FaXTwitter className={props.className} />
    else if (props.link.includes("github.com"))
      return <FaGithub className={props.className} />
    else return <FaGlobe className={props.className} />
  }

  return null;
}

interface FollowingCardProps {
  canUnfollow: boolean;
  followed: Employer;
  onUnfollow: () => Promise<void>;
}

function FollowingCard({ canUnfollow, followed, onUnfollow }: FollowingCardProps) {
  const [isPending, setIsPending] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();

    if (canUnfollow && !isPending) {
      setIsPending(true);
      onUnfollow().finally(() => setIsPending(false));
    }
  }

  return (
    <li className="relative">
      <EmployerCard employer={followed} linkNewTab size="sm" />
      {canUnfollow && (
        <div className="absolute top-1 right-2.5">
          {isPending ? (
            <span className="loading loading-ring" /> 
          ) : (
            <button className="btn btn-circle btn-xs mt-1 translate-x-0.5" onClick={handleClick}>
              <FaUserMinus />
            </button>
          )}
        </div>
      )}
    </li>
  )
}

interface ApplicantProfileProps {
  applicant: ApplicantDetail;
  chat: Chat | undefined;
  user: AuthenticatedUser | null;
}

export default function ApplicantProfile({ applicant, chat, user }: ApplicantProfileProps) {
  const router = useRouter();

  const [following, setFollowing] = useState<Employer[]>(user?.type === "Applicant" ? user.following : []);
  const [isPending, setIsPending] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const isAdmin = !!user && user.roles.includes("Admin");
  const isAuthorized = !!user && (isAdmin || user.id === applicant.id);

  const isFollowed = useMemo(() => {
    return applicant.following.some(followed => followed.id === user?.id);
  }, [following, user])

  useEffect(() => {
    router.refresh();
  }, [])

  useEffect(() => {
    setFollowing(user?.type === "Applicant" ? user.following : []);
  }, [user])

  function deleteApplicant() {
    if (!isPending) {
      setIsPending(true);
      deleteUser(applicant.id).then(() => setIsPending(false));
    }
  }

  async function unfollow(followed: Employer) {
    await unfollowEmployer(applicant.id, followed.id);

    if (user?.type === "Applicant")
      setFollowing(following.filter(employer => employer.id !== followed.id));
  }

  return (
    <div className="flex h-full">
      <div className={`@container/main min-w-0 relative h-full flex-2 ${showFollowing && applicant.following.length > 0 ? "hidden" : ""} md:block`}>
        {applicant.isPrivate && !isAuthorized ? (
          <div className="w-full absolute absolute-center flex flex-col items-center opacity-60 p-5">
            <FaLock className="text-9xl" />
            <p className="text-xl mt-7 font-medium text-center">This user&apos;s profile is private</p>
          </div>
        ) : (
          <div className="flex flex-col h-full max-w-7xl p-5 mx-auto @3xl/main:p-10">
            <div>
              {(applicant.readyToWork || isFollowed) && (
                <div className="flex items-center mb-1 h-6">
                  {applicant.readyToWork && (
                    <div className="badge badge-success badge-soft gap-1.25 h-auto px-1.5 mr-2 leading-none pt-0.5 pb-px">
                      <ReadyToWork className="text-lg" />
                      <span className="text-[0.9375rem] -translate-y-px">Ready To Work</span>
                    </div>
                  )}
                  {isFollowed && (
                    <div className="badge text-base-content/60 text-[0.9375rem] border border-base-content/15 leading-1 px-2 bg-transparent">
                      Follows you
                    </div>
                  )}
                </div>
              )}
              <h1 className="font-black text-4xl mb-2 @3xl/main:text-6xl">
                {applicant.firstName} {applicant.middleName} {applicant.lastName}
              </h1>
              {(applicant.link1 || applicant.link2) && (
                <p className="flex gap-x-3 gap-y-1 flex-wrap mt-1">
                  {applicant.link1 && (
                    <Link 
                      className="px-2 text-sm font-medium bg-blue-500/15 text-blue-500 rounded-xl inline-flex items-center"
                      href={applicant.link1}
                      target="_blank"
                    >
                      <LinkIcon className="text-blue-500 text-xs inline-flex mr-1.5" link={applicant.link1} />
                      {trimLink(applicant.link1)}
                    </Link>
                  )}
                  {applicant.link2 && (
                    <a 
                      className="px-2 text-sm font-medium bg-blue-500/15 text-blue-500 rounded-xl inline-flex items-center"
                      href={applicant.link2}
                      target="_blank"
                    >
                      <LinkIcon className="text-blue-500 text-xs inline-flex mr-1.5" link={applicant.link2} />
                      {trimLink(applicant.link2)}
                    </a>
                  )}
                </p>
              )}
              <div className="leading-snug text-base-content/75 flex items-center gap-x-4 text-base mt-1.5 mb-1 flex-wrap">
                <p className="flex items-center flex-wrap">
                  {applicant.industry && <span className="mr-2">{applicant.industry}</span>}
                  {applicant.industry && applicant.preferredOccupation && <FaChevronRight className="text-xs mr-2" />}
                  {applicant.preferredOccupation && <span className="font-medium">{applicant.preferredOccupation}</span>}
                </p>
                {applicant.location && (
                  <p className="flex items-center">
                    <FaLocationDot className="inline-block mr-1.75 text-xs" />
                    <span>{applicant.location}</span>
                  </p>
                )}
              </div>
              <div className="flex items-start mt-2">
                <div 
                  className={`text-center ${applicant.following.length > 0 ? "group cursor-pointer hover:text-primary" : ""}`} 
                  onClick={() => setShowFollowing(!showFollowing)}
                >
                  <p className="flex items-center text-base-content/60 group-hover:text-primary">
                    <RiUserShared2Fill className="mr-2" />
                    <span className="font-normal text-sm leading-none">Following</span>
                  </p>
                  <p className="font-bold text-lg">{applicant.following.length}</p> 
                </div>
                {user?.type === "Employer" && (
                  <>
                    <span className="w-px h-10 border-r border-r-base-content/20 mx-4"></span>
                    <Link className="btn btn-neutral w-29" href={`/chat/${chat?.id ?? `new?withUser=${applicant.id}`}`}>
                      <FaMessage />Message
                    </Link>
                  </>
                )}
                {isAuthorized && (
                  <>
                    <span className="w-px h-10 border-r border-r-base-content/20 mx-4"></span>
                    <Link 
                      className="btn btn-outline btn-primary" 
                      href={`/profile/${isAdmin ? applicant.id + "/" : ""}edit`}
                    >
                      <FaPencil />Edit
                    </Link>
                    {isAdmin && (
                      <div className="dropdown dropdown-bottom dropdown-end ml-4">
                        <div className="btn btn-outline btn-error -mb-px w-26" role="button" tabIndex={0}>
                          {isPending ? <span className="loading loading-ring" /> : <><FaTrash />Delete</>} 
                        </div>
                        {!isPending && (
                          <div 
                            className="dropdown-content menu rounded z-1 w-36 p-3 shadow-sm bg-base-100 dark:bg-base-200 mt-1.5"
                            tabIndex={0} 
                          >
                            <p className="mb-2 font-medium text-center">Confirm?</p>
                            <div className="flex">
                              <button className="btn btn-error btn-sm mr-3 flex-1" onClick={deleteApplicant}>
                                Yes
                              </button>
                              <button className="btn btn-sm flex-1" onClick={e => e.currentTarget.blur()}>
                                No
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            {applicant.about && <p className="mt-4">{applicant.about}</p>}
            {applicant.workExperience.length > 0 && (
              <div className="mt-7">
                <h2 className="font-bold text-2xl mb-3">Work Experience</h2>
                <div>
                  {applicant.workExperience.map((entry, idx) => (
                    <div className="flex items-center gap-5 last:[&_.item]:border-0 mb-2" key={idx}>
                      <div className="hidden bg-primary/15 p-1.5 rounded-full @lg/main:block">
                        <FaBriefcase className="text-primary text-sm -translate-y-px" />
                      </div>
                      <div className="border-b border-b-base-content/20 item pb-2 grow">
                        <h3 className="text-lg/6 font-medium">
                          {entry.position}&nbsp; 
                          {entry.employer && (
                            <>
                              <span className="text-base-content/75">&bull; </span>
                              <span className="text-base-content/75 italic">{entry.employer}</span>
                            </>
                          )}
                        </h3>
                        <p className="text-base-content/60">
                          <span>
                            {entry.startMonth && getMonthString(entry.startMonth)} {entry.startYear}—
                            {
                              !entry.endYear && !entry.endMonth 
                                ? "present"
                                : `${entry.endMonth ? getMonthString(entry.endMonth) + " " : ""}${entry.endYear ?? new Date().getFullYear()}`
                            }
                          </span>
                        </p>
                        {entry.description && <p className="text-sm mt-1">{entry.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-x-10 flex-wrap">
              {applicant.education.length > 0 && (
                <div className="flex-1 min-w-xs mt-7">
                  <h2 className="font-bold text-2xl mb-3">Education</h2>
                  <div>
                    {applicant.education.map((entry, idx) => (
                      <div className="flex items-center gap-5 last:[&_.item]:border-0 mb-2" key={idx}>
                        <div className="hidden bg-primary/15 p-1.5 rounded-full @lg/main:block">
                          <FaGraduationCap className="text-primary" />
                        </div>
                        <div className="border-b border-b-base-content/20 item pb-2 grow">
                          <h3 className="text-lg/6 font-medium">{entry.institution}</h3>
                          <p className="text-base-content/60 mt-0.5 mb-1 flex items-center gap-x-4 flex-wrap leading-tight">
                            <span>
                              {entry.startMonth && getMonthString(entry.startMonth)} {entry.startYear}—
                              {
                                !entry.endYear && !entry.endMonth 
                                  ? "present"
                                  : `${entry.endMonth ? getMonthString(entry.endMonth) + " " : ""}${entry.endYear ?? new Date().getFullYear()}`
                              }
                            </span>
                            {entry.institutionLocation && (
                              <span className="inline-flex items-center">
                                <FaLocationDot className="inline-block text-xs mr-1.75 align-baseline" />
                                {entry.institutionLocation}
                              </span>
                            )}
                          </p>
                          <div className="flex gap-5 justify-between">
                            {entry.degree && (
                              <div>
                                <p className="text-[0.9rem] opacity-70">Degree</p>
                                <p className="leading-tight">{entry.degree}</p>
                              </div>
                            )}
                            {entry.major && (
                              <div className={entry.degree ? "text-right" : "text-left"}>
                                <p className="text-[0.9rem] opacity-70">Major</p>
                                <p className="leading-tight">{entry.major}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {applicant.certificationsAndLicenses.length > 0 && (
                <div className="flex-1 min-w-xs mt-7">
                  <h2 className="font-bold text-2xl mb-3">Certifications & Licenses</h2>
                  <div>
                    {applicant.certificationsAndLicenses.map((certificateOrLicense, idx) => (
                      <div className="flex items-center gap-5 last:[&_.item]:border-0 mb-2" key={idx}>
                        <div className="hidden bg-primary/15 p-1.5 rounded-full @lg/main:block">
                          <PiCertificateFill className="text-primary" />
                        </div>
                        <div className="border-b border-b-base-content/20 item pb-2 grow" key={idx}>
                          <h3 className="text-lg/6 font-medium">
                            {certificateOrLicense.name}&nbsp;
                            <span className="text-base-content/75"> 
                              &bull; <span className="italic">{certificateOrLicense.issuer}</span>
                            </span>
                          </h3>
                          <p className="text-base-content/60">
                            Issued in&nbsp;
                            {certificateOrLicense.issuedMonth && getMonthString(certificateOrLicense.issuedMonth) + " "} 
                            {certificateOrLicense.issuedYear}
                            {(certificateOrLicense.expirationYear || certificateOrLicense.expirationMonth) && (
                              <>
                                ,
                                <span className="pl-1.5">
                                  Expires&nbsp;
                                  {certificateOrLicense.expirationMonth && getMonthString(certificateOrLicense.expirationMonth) + " "}
                                  {certificateOrLicense.expirationYear ?? new Date().getFullYear()}
                                </span>
                              </>
                            )}
                          </p>
                          <p className="text-sm mt-1">{certificateOrLicense.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {applicant.skills.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mt-7 mb-4">Skills</h2>
                <div className="flex gap-2.5 flex-wrap items-center">
                  {applicant.skills.map((skill, idx) => (
                    <span className="gap-1.5 font-medium text-primary px-3 py-1 rounded bg-primary/15 shrink-0" key={idx}>
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {
              applicant.id === user?.id &&
              applicant.workExperience.length === 0 &&
              applicant.education.length === 0 &&
              applicant.certificationsAndLicenses.length === 0 &&
              applicant.skills.length === 0 && (
                <div className="flex justify-center items-center relative grow rounded-xl max-w-7xl mt-5">
                  <div className="w-full text-center">
                    <EmptyResume className="mx-auto text-9xl opacity-17 rotate-6" />
                    <p className="text-lg mt-7 mb-5 leading-tight text-base-content/60">
                      Your profile resume is empty. Build your resume to help attract employers.
                    </p>
                    <Link className="btn btn-primary btn-sm" href="/profile/edit">Get started</Link>
                  </div>
                </div>
              )
            }
          </div>
        )}
      </div>
      {showFollowing && applicant.following.length > 0 && (
        <aside className="flex flex-col w-full shrink-0 min-w-76 md:flex-1 md:border-x md:border-x-base-content/20">
          <div className="flex justify-between items-center p-3 bg-base-100 border-b border-b-base-content/20">
            <h3 className="font-bold text-center ml-2 text-lg">
              Following <span className="h-fit text-primary">{applicant.following.length}</span>
            </h3>
            <button className="btn btn-sm btn-circle" onClick={() => setShowFollowing(false)}>
              <FaXmark />
            </button>
          </div>
          <ul className="flex flex-col gap-3 px-4 my-5 grow overflow-auto scrollbar-thin gutter-stable pointer-fine:pr-0.75 pointer-fine:mr-0.75">
            {applicant.following.map(followed => {
              return (
                <FollowingCard 
                  canUnfollow={isAuthorized} 
                  followed={followed} 
                  key={followed.id} 
                  onUnfollow={() => unfollow(followed)} 
                />
              ) 
            })}
          </ul>
        </aside>
      )}
    </div>
  )
}