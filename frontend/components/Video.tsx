export const Video = ({ videoId }: { videoId: string }) => (
  <div className="bg-black aspect-video rounded-lg flex items-center justify-center text-white">
    Video Player ({videoId})
  </div>
);