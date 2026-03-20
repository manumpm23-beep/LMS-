'use client';

import { useEffect, useRef, useCallback } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';

interface VideoPlayerProps {
    videoId: string;
    youtubeUrl: string;
    startPositionSeconds: number;
    onProgress: (time: number) => void;
    onCompleted: () => void;
}

const getYoutubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
};

export default function VideoPlayer({
    videoId,
    youtubeUrl,
    startPositionSeconds,
    onProgress,
    onCompleted
}: VideoPlayerProps) {
    const ytVideoId = getYoutubeId(youtubeUrl);
    const playerRef = useRef<any>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const clearProgressInterval = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const startProgressInterval = useCallback(() => {
        clearProgressInterval();
        intervalRef.current = setInterval(async () => {
            if (playerRef.current) {
                const time = await playerRef.current.getCurrentTime();
                onProgress(time);
            }
        }, 5000);
    }, [clearProgressInterval, onProgress]);

    useEffect(() => {
        return () => clearProgressInterval();
    }, [clearProgressInterval]);

    const onReady: YouTubeProps['onReady'] = (event) => {
        playerRef.current = event.target;
    };

    const onStateChange: YouTubeProps['onStateChange'] = async (event) => {
        // 1 = playing, 2 = paused, 0 = ended
        if (event.data === 1) {
            startProgressInterval();
        } else {
            clearProgressInterval();
            if (playerRef.current) {
                const time = await playerRef.current.getCurrentTime();
                onProgress(time);
            }
            if (event.data === 0) {
                onCompleted();
            }
        }
    };

    if (!ytVideoId) {
        return <div className="bg-black aspect-video flex items-center justify-center text-white">Invalid YouTube URL</div>;
    }

    const opts: YouTubeProps['opts'] = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 0,
            start: Math.floor(startPositionSeconds),
        },
    };

    return (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-md">
            <YouTube
                videoId={ytVideoId}
                opts={opts}
                className="absolute top-0 left-0 w-full h-full"
                iframeClassName="w-full h-full object-cover"
                onReady={onReady}
                onStateChange={onStateChange}
            />
        </div>
    );
}
