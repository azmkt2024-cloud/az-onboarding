export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <img className="footer-logo-img" src="/az_logo.png" alt="에즈금융서비스" />
          </div>
          <a className="footer-cta" href="https://www.azfinancial.co.kr/" target="_blank" rel="noopener">
            에즈금융서비스 바로가기 →
          </a>
        </div>

        <p className="footer-msg">
          무경력 신입 설계사를 위한 학습 공간으로, 시험 준비부터 실무 적응까지 함께 성장하도록 돕습니다.
        </p>

        <div className="footer-divider" />

        <div className="footer-info">
          <div className="footer-info-row">
            <span>대표 이태형</span>
            <span>사업자등록번호 204-86-38214</span>
          </div>
          <div className="footer-info-row">
            <span>대표전화 1644-0503</span>
            <span>az_ko@azfins.com</span>
          </div>
          <div className="footer-info-row">
            <span>서울특별시 강서구 공항대로 165</span>
          </div>
        </div>
        <div className="footer-copy">© 2026 AZ Financial Service. All rights reserved.</div>
      </div>
    </footer>
  );
}
