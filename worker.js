
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return Response.json(
        { error: "API setup in progress" },
        { status: 503 }
      );
    }

    return env.ASSETS.fetch(request);
  }
};

