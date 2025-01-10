// 메일 작성 폼 하단의 툴바 감지 및 아이콘 추가
function addButtonToToolbar() {
    const observer = new MutationObserver((mutations, obs) => {
        const toolbar = document.querySelector('.bAK');
        if (toolbar) {
            addOrgTreeButton(toolbar);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// 조직도 아이콘을 하단 툴바에 추가
function addOrgTreeButton(toolbar) {
    if (document.querySelector('.orgTree-button')) return;

    const button = document.createElement('div');
    button.className = 'orgTree-button btA J-J5-Ji T-I';
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', '조직도 열기');
    button.setAttribute('aria-label', '조직도 열기');

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

    button.innerHTML = `
        <div class="asa" style="display: flex; align-items: center; justify-content: center;">
            <img src="${chrome.runtime.getURL('icons/icon_ex.svg')}"
                 style="width: auto; height: 21px; margin: 0; object-fit: contain;"
                 alt="조직도">
        </div>
    `;

    button.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openOrgTree' });
    });

    button.addEventListener('mouseover', () => button.classList.add('J-J5-Ji'));
    button.addEventListener('mouseout', () => button.classList.remove('J-J5-Ji'));

    toolbar.appendChild(button);
}

// 이메일 자동 삽입 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "insertEmail") {
        try {
            // 즉시 응답을 보내서 연결이 끊어지지 않도록 함
            sendResponse({ received: true });

            const maxAttempts = 10;
            let attempts = 0;

            const insertEmail = () => {
                const recipientField = document.querySelector('input[role="combobox"].u2.agP.aFw') ||
                    document.querySelector('input[role="combobox"]') ||
                    document.querySelector('.aeF input');

                // 이메일 자동완성 팝업 제거
                const element = document.querySelector('.afC.mS5Pff');
                if (element) {
                    element.remove();
                }

                if (recipientField) {
                    const currentValue = recipientField.value;
                    const newEmail = request.email;

                    // 이메일이 이미 있는지 확인
                    const emailList = currentValue.split(',').map(email => email.trim());
                    if (!emailList.includes(newEmail)) {
                        recipientField.value = currentValue + (currentValue ? ', ' : '') + newEmail;

                        // 이벤트 발생 (keydown 제거)
                        recipientField.dispatchEvent(new Event('input', { bubbles: true }));
                        recipientField.dispatchEvent(new Event('change', { bubbles: true }));

                        // 포커스 제거
                        recipientField.blur();

                        console.log('이메일 삽입 성공:', newEmail);
                    }
                    return true;
                }

                if (++attempts < maxAttempts) {
                    setTimeout(insertEmail, 500); // 500ms 후 재시도
                } else {
                    console.error('수신인 필드를 찾을 수 없습니다.');
                }
                return false;
            };

            insertEmail();
        } catch (error) {
            console.error('이메일 삽입 중 오류:', error);
        }
    }
    return true;
});


// 초기화
addButtonToToolbar();