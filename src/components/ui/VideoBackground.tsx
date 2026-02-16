interface VideoBackgroundProps {
  videoSrc: string;
}

export function VideoBackground({ videoSrc }: VideoBackgroundProps) {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden -z-10">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
}
