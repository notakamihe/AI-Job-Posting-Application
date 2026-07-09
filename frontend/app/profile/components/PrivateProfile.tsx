"use client"

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FaLock } from "react-icons/fa6";

export default function PrivateProfile() {
	const router = useRouter();

	useEffect(() => {
		router.refresh();
	}, [])

	return (
		<div className="flex h-full">
			<div className={`@container/main min-w-0 relative h-full flex-2 md:block`}>
				<div className="w-full absolute absolute-center flex flex-col items-center opacity-60 p-5">
					<FaLock className="text-9xl" />
					<p className="text-xl mt-7 font-medium text-center">This user&apos;s profile is private</p>
				</div>
			</div>
		</div>
	)
}