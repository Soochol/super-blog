export default function Footer() {
    return (
        <footer className="bg-gray-50 border-t mt-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-sm">
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4">Super Blog</h3>
                        <p className="text-gray-500 max-w-xs">
                            가장 정확한 IT 기기 스펙 분석과 가격 비교를 통해 현명한 소비를 돕습니다.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4">카테고리</h3>
                        <ul className="space-y-2 text-gray-500">
                            <li><a href="/laptop" className="hover:text-blue-600 transition-colors">노트북 추천</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">태블릿 추천</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">스마트폰 비교</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4">정보</h3>
                        <ul className="space-y-2 text-gray-500">
                            <li><a href="#" className="hover:text-blue-600 transition-colors">이용약관</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">개인정보처리방침</a></li>
                            <li><a href="#" className="hover:text-blue-600 transition-colors">제휴 문의</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t pt-8">
                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-600 text-center font-medium">
                            "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다."
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
                        <p>© 2026 Super Blog. All rights reserved.</p>
                        <p>본 사이트의 제품 가격 및 스펙 정보는 변경될 수 있습니다.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
