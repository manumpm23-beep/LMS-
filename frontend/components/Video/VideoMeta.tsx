export default function VideoMeta({ title, description }: { title: string; description?: string }) {
    return (
        <div className="mt-8 bg-white p-6 md:p-8 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
            {description ? (
                <p className="mt-4 text-gray-600 whitespace-pre-wrap leading-relaxed">{description}</p>
            ) : (
                <p className="mt-4 text-gray-400 italic">No description provided for this lesson.</p>
            )}
        </div>
    );
}
