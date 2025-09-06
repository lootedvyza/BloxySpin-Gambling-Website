export default function Alert({ alert }) {
    if (!alert || !alert.show) {
        return null;
    }

    return (
        <div>
            <div className="flex flex-col p-5 bg-[#12192f] border border-solid border-[#0077ff] rounded-[10px] mb-[10px]">
                <h1 className="text-[#007bff] text-[1.25rem]">
                    {alert.title || "Lorem ipsum dolor sit amet"}
                </h1>
                <p className="text-[rgb(212,208,208)]">
                    {alert.message || "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}
                    {alert.link && (
                        <a href={alert.link} target="_blank" rel="noopener noreferrer" className="text-[#007bff]">
                            here
                        </a>
                    )}
                </p>
            </div>
        </div>
    );
}