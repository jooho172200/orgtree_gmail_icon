// 메일 작성 폼 하단의 툴바 감지 및 아이콘 추가
function addButtonToToolbar() {
    const observer = new MutationObserver((mutations, obs) => {
        // 툴바 영역 감지
        const toolbar = document.querySelector('.bAK'); // Gmail의 기본 툴바 클래스, 추후에 변경될 수 있음

        if (toolbar) {
            // 툴바를 발견하면 아이콘 추가 후 관찰 종료
            addOrgTreeButton(toolbar);
            //obs.disconnect();         // 관찰 종료 -> Gmail의 동적 로딩을 위해 주석 처리
        }
    });

    // DOM 변화를 감지하도록 설정
    observer.observe(document.body, { childList: true, subtree: true });
}

// 조직도 아이콘을 하단 툴바에 추가
function addOrgTreeButton(toolbar) {
    // 기존에 아이콘이 있으면 중복 추가 방지
    if (document.querySelector('.orgTree-button')) return;

    // 새 버튼 생성
    const button = document.createElement('div');
    button.className = 'orgTree-button btA J-J5-Ji T-I'; // Gmail의 기본 버튼 스타일 클래스 추가
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', '조직도 열기');
    button.setAttribute('aria-label', '조직도 열기');

    // 버튼 스타일 추가
    button.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: 0 4px;
        margin: 0;
        height: 100%;
        vertical-align: middle;
        user-select: none;
        cursor: pointer;
    `;

    // 버튼 내부에 아이콘 사진 추가
    button.innerHTML = `
    <div class="asa" style="display: flex; align-items: center; justify-content: center;">
        <img src="${chrome.runtime.getURL('icons/icon_ex.svg')}"
             style="width: auto; height: 21px; margin: 0; object-fit: contain;"
             alt="조직도">
    </div>
`;

    // 버튼 클릭 이벤트 추가
    button.addEventListener('click', () => {
        console.log('버튼 클릭됨'); // 클릭 이벤트 확인용
        chrome.runtime.sendMessage({ action: 'openOrgTree' });
    });

    // 마우스 오버 효과 추가
    button.addEventListener('mouseover', () => {
        button.classList.add('J-J5-Ji');
    });

    button.addEventListener('mouseout', () => {
        button.classList.remove('J-J5-Ji');
    });

    // 툴바에 버튼 추가
    toolbar.appendChild(button);

}


// 이메일 삽입 요청 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "insertEmail") {
        // Gmail 작성 폼의 수신인 필드 탐색
        const recipientField = document.querySelector('textarea[name="to"]'); // DOM 변경될 수 도 있음
        if (recipientField) {
            // 이메일 추가
            recipientField.value += (recipientField.value ? ', ' : '') + request.email;

            // Gmail 동적 업데이트 반영을 위해 이벤트 발생
            recipientField.dispatchEvent(new Event('input', {bubbles: true}));
        }
    }
});

//아이콘 추가 함수 실행
addButtonToToolbar();