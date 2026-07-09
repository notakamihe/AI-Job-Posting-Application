export default function Loading() {
  return (
    <div className="grow flex flex-col px-5 pb-7 md:px-10 md:pb-10">
      <div className="sticky top-0 z-10 pt-5 pb-5 md:pt-7">
        <h1 className="text-2xl font-bold mb-3">Activity</h1>
        <div className="skeleton max-w-70 h-10" />
      </div>
      <div className="grow flex flex-col gap-5 max-w-4xl">
        <div className="skeleton w-full min-h-39 flex-1" />
        <div className="skeleton w-full min-h-39 flex-1" />
        <div className="skeleton w-full min-h-39 flex-1" />
        <div className="skeleton hidden w-full min-h-40 flex-1 [@media(min-height:55rem)]:flex" />
      </div>
    </div>
  );
}