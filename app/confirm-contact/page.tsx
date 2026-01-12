import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ConfirmContactPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = typeof searchParams.token === "string" ? searchParams.token : "";

  if (!token) {
    return (
      <div className="min-h-screen bg-white px-6 py-12 text-gray-900">
        <div className="mx-auto w-full max-w-[600px]">
          <h1 className="text-2xl font-semibold text-gray-800">
            Contact Confirmation
          </h1>
          <p className="mt-2 text-sm text-red-600">Missing token.</p>
        </div>
      </div>
    );
  }

  const contact = await prisma.emergencyContact.findFirst({
    where: { confirmationToken: token },
    select: {
      id: true,
      name: true,
      isConfirmed: true,
      confirmationExpires: true,
    },
  });

  if (!contact) {
    return (
      <div className="min-h-screen bg-white px-6 py-12 text-gray-900">
        <div className="mx-auto w-full max-w-[600px]">
          <h1 className="text-2xl font-semibold text-gray-800">
            Contact Confirmation
          </h1>
          <p className="mt-2 text-sm text-red-600">
            This confirmation link is invalid.
          </p>
        </div>
      </div>
    );
  }

  if (contact.isConfirmed) {
    return (
      <div className="min-h-screen bg-white px-6 py-12 text-gray-900">
        <div className="mx-auto w-full max-w-[600px]">
          <h1 className="text-2xl font-semibold text-gray-800">
            Contact Confirmed
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            You’re already confirmed as an emergency contact.
          </p>
        </div>
      </div>
    );
  }

  const expired =
    contact.confirmationExpires && contact.confirmationExpires.getTime() < Date.now();
  if (expired) {
    return (
      <div className="min-h-screen bg-white px-6 py-12 text-gray-900">
        <div className="mx-auto w-full max-w-[600px]">
          <h1 className="text-2xl font-semibold text-gray-800">
            Link Expired
          </h1>
          <p className="mt-2 text-sm text-red-600">
            This confirmation link has expired (24h).
          </p>
        </div>
      </div>
    );
  }

  await prisma.emergencyContact.update({
    where: { id: contact.id },
    data: {
      isConfirmed: true,
      confirmationToken: null,
      confirmationExpires: null,
    },
  });

  return (
    <div className="min-h-screen bg-white px-6 py-12 text-gray-900">
      <div className="mx-auto w-full max-w-[600px]">
        <h1 className="text-2xl font-semibold text-gray-800">
          Contact Confirmed
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Thanks! You’ll be notified if your friend misses their check-in deadline.
        </p>
        <div className="mt-6">
          <Link href="/" className="text-sm text-orange-500 hover:underline">
            Go to Still Alive?
          </Link>
        </div>
      </div>
    </div>
  );
}

