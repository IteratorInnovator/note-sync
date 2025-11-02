import { X } from "lucide-react";

const FeatureModal = ({ feature, onClose }) => {
    if (!feature) return null;
    
    const Icon = feature.icon;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 relative animate-in">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
                
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                        <Icon className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{feature.title}</h2>
                        {feature.badge && (
                            <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-full">
                                {feature.badge}
                            </span>
                        )}
                    </div>
                </div>
                
                <p className="text-gray-600 mb-6">{feature.description}</p>
                
                <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">How to use:</h3>
                    <ol className="space-y-3">
                        {feature.steps.map((step, index) => (
                            <li key={index} className="flex gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                    {index + 1}
                                </span>
                                <span className="text-gray-700 pt-0.5">{step}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default FeatureModal;