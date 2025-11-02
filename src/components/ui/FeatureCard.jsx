const FeatureCard = ({ feature, onClick }) => {
    const Icon = feature.icon;
    
    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group relative"
        >
            <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <Icon className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
        </div>
    );
};

export default FeatureCard;