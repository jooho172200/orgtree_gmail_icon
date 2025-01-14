// 메일 작성 폼 하단의 툴바 감지 및 아이콘 추가
function addButtonToToolbar() {
    const observer = new MutationObserver((mutations, obs) => {
        const toolbar = document.querySelector('.bAK'); // 하단 툴바 영역을 찾음, DOM 변화 시 수정
        if (toolbar) {
            addOrgTreeButton(toolbar);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// 조직도 아이콘을 하단 툴바에 추가
function addOrgTreeButton(toolbar) {

    //이미 버튼이 추가되어 있는 경우 중복 추가 방지
    if (document.querySelector('.orgTree-button')) return;

    //버튼 생성 & 속성 설정
    // 마우스를 올릴 때 표시될 문구 등, 기존 지메일의 버튼 스타일에 맞게 설정
    const button = document.createElement('div');
    button.className = 'orgTree-button btA J-J5-Ji T-I';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', '조직도 열기');
    button.setAttribute('aria-label', '조직도 열기');

    //버튼을 지메일의 UI와 일치 시킴
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

    //버튼에 조직도 아이콘을 표시, icon_ex.svg 파일 사용
    button.innerHTML = `
        <div class="asa" style="display: flex; align-items: center; justify-content: center;">
            <img src="${chrome.runtime.getURL('icons/icon_ex.svg')}"
                 style="width: auto; height: 21px; margin: 0; object-fit: contain;"
                 alt="조직도">
        </div>
    `;

    //클릭 시 조직도 팝업 열기 요청
    button.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openOrgTree' });
    });

    //마우스 오버 시 버튼 스타일 변경
    button.addEventListener('mouseover', () => button.classList.add('J-J5-Ji'));
    button.addEventListener('mouseout', () => button.classList.remove('J-J5-Ji'));

    //버튼을 툴바에 추가
    toolbar.appendChild(button);
}

// 이메일 자동 삽입 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 이메일 삽입 액션인 경우 실행
    if (request.action === "insertEmail") {
        try {
            // 즉시 응답을 보내서 연결이 끊어지지 않도록 함
            sendResponse({ received: true });

            // 이메일 삽입 처리 최대 횟수 10회로 지정 ->
            const maxAttempts = 10;
            let attempts = 0;

            // 이메일 삽입 함수, 지메일 작성 폼의 수신인 필드를 감지하여 이메일 삽입
            const insertEmail = () => {
                const recipientField = document.querySelector('input[role="combobox"].u2.agP.aFw') ||
                    document.querySelector('input[role="combobox"]') ||
                    document.querySelector('.aeF input');

                // 이메일 자동 추천 팝업 제거, 조직도에서 이메일 삽입 시, 자동완성 창이 화면에 남아있는 버그 해셜 위함
                const autoRecommend = document.querySelector('.afC.mS5Pff'); // 이메일 자동완성 팝업 DOM
                if (autoRecommend) {
                    autoRecommend.remove();
                }

                // 수신인 필드가 있는 경우 이메일 삽입
                if (recipientField) {
                    const currentValue = recipientField.value;
                    const newEmail = request.email;

                    // 이메일이 이미 있는지 확인
                    const emailList = currentValue.split(',').map(email => email.trim());
                    if (!emailList.includes(newEmail)) {
                        recipientField.value = currentValue + (currentValue ? ', ' : '') + newEmail;

                        // 지메일의 이벤트 리스너가 이벤트를 받아서 이메일을 삽입함
                        recipientField.dispatchEvent(new Event('input', { bubbles: true }));    //필드에 값이 입력됨을 알림
                        recipientField.dispatchEvent(new Event('change', { bubbles: true }));   //필드 값이 변경됨을 알림

                        // 포커스 제거, 사용자가 추가로 입력을 하거나 다른 UI 조작 시 방해 방지
                        recipientField.blur();

                        // 이메일 삽입 성공 로그 출력
                        console.log('이메일 삽입 성공:', newEmail);
                    }
                    return true;
                }

                // 수신인 필드를 찾을 수 없어 여러 번 클릭하여 이메일 삽입을 시도할 때
                if (++attempts < maxAttempts) {
                    setTimeout(insertEmail, 500); // 500ms 후 재시도
                } else {
                    console.error('수신인 필드를 찾을 수 없습니다.');
                }
                return false;
            };

            // 이메일 삽입 함수 호출
            insertEmail();
        } catch (error) {
            console.error('이메일 삽입 중 오류:', error);
        }
    }
    return true;
});


//툴바 버튼 추가 함수 호출
addButtonToToolbar();