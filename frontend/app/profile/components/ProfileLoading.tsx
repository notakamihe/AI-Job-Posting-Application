export default function ProfileLoading() {
  return (
    <div className="flex flex-col w-full h-full p-5 max-w-7xl mx-auto md:p-10">
      <div className="flex flex-wrap gap-5 mb-5">
        <div className="flex-2">
          <div className="skeleton w-7/10 min-w-3xs h-8 mb-2.5 md:h-14" />
          <div className="skeleton w-1/5 min-w-30 h-5 mb-2.5" />
          <div className="skeleton w-1/2 min-w-3xs h-4 mb-2.5" />
          <div className="skeleton w-full h-10 max-w-xs" />
        </div>
      </div>
      <div className="mb-7">
        <div className="skeleton rounded-md w-full h-4" />
        <div className="skeleton rounded-md w-full h-4 mt-2" />
        <div className="skeleton rounded-md w-1/4 h-4 mt-2" />
      </div>
      <div className="grow mb-10 skeleton h-55" />
      <div className="grow skeleton h-55" />
    </div>
  );
}