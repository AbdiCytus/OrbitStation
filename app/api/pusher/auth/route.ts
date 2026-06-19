import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await req.text();
    const [socketId, channelName] = data.split("&").map((str) => str.split("=")[1]);

    const decodedSocketId = decodeURIComponent(socketId);
    const decodedChannelName = decodeURIComponent(channelName);

    const presenceData = {
      user_id: session.user.id,
      user_info: {
        name: session.user.name,
        username: (session.user as any).username,
        image: session.user.image,
      },
    };

    const authResponse = pusherServer.authorizeChannel(
      decodedSocketId,
      decodedChannelName,
      presenceData
    );

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
