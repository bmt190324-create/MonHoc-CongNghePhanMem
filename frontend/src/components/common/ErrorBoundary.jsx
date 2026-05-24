import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
                        <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                            <ExclamationTriangleIcon className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Đã có lỗi xảy ra</h1>
                        <p className="text-gray-500 text-sm mb-6">
                            Hệ thống gặp sự cố không mong muốn. Vui lòng thử tải lại trang hoặc liên hệ quản trị viên.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center justify-center w-full bg-primary-600 text-white px-4 py-2.5 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                        >
                            <ArrowPathIcon className="w-5 h-5 mr-2" />
                            Tải lại trang
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
