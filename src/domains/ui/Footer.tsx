export default function Footer() {
    return (
        <footer className="bg-white border-t-4 border-black mt-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-sm">
                    <div>
                        <h3 className="font-black text-xl text-black mb-4">SUPER BLOG</h3>
                        <p className="text-black font-medium max-w-xs leading-relaxed">
                            가장 정확한 IT 기기 스펙 분석과 가격 비교를 통해 현명한 소비를 돕습니다.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-black text-lg text-black mb-4 bg-neo-green inline-block px-1">카테고리</h3>
                        <ul className="space-y-3 font-bold text-black">
                            <li><a href="/laptop" className="hover:text-neo-pink hover:underline transition-colors">노트북 리뷰</a></li>
                            <li><a href="#" className="hover:text-neo-blue hover:underline transition-colors">태블릿 추천</a></li>
                            <li><a href="#" className="hover:text-neo-orange hover:underline transition-colors">스마트폰 매치업</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-black text-lg text-black mb-4 bg-neo-blue inline-block px-1 text-white">정보</h3>
                        <ul className="space-y-3 font-bold text-black">
                            <li><a href="#" className="hover:underline transition-colors">이용약관</a></li>
                            <li><a href="#" className="hover:underline transition-colors">개인정보처리방침</a></li>
                            <li><a href="#" className="hover:underline transition-colors">제휴 문의</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t-2 border-black pt-8">
                    <div className="bg-neo-yellow border-4 border-black shadow-hard p-4 mb-8 transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-hard-lg transition-all">
                        <p className="text-base text-black text-center font-bold">
                            "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다."
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-bold text-black">
                        <p>© 2026 SUPER BLOG. ALL RIGHTS RESERVED.</p>
                        <p className="bg-black text-white px-2 py-1">본 사이트의 제품 가격 및 스펙 정보는 변경될 수 있습니다.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
