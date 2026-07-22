import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import FeedbackClient from "./FeedbackClient";

export default async function FeedbackPage() {
  const session = await getServerSession(authOptions);
  let user = null;
  
  if (session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { department: true }
    });
    
    if (dbUser) {
      user = {
        name: dbUser.name || session.user.name || "Anonymous",
        department: dbUser.department?.name || null
      };
    }
  }

  
  const repetitiveProblems = await prisma.submission.findMany({
    where: { type: "RepetitiveProblem", status: "Accepted" },
    select: { id: true, title: true }
  });

  return <FeedbackClient loggedInUser={user} repetitiveProblems={repetitiveProblems} />;

}
