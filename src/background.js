// 확장프로그램이 설치되거나 업데이트될 때 실행
chrome.runtime.onInstalled.addListener(() => {
    console.log('조직도 확장프로그램이 설치/업데이트 되었습니다.');
});

// content script나 팝업으로부터의 메시지 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 조직도 팝업 열기 요청 처리
    if (request.action === "openOrgTree") {
        // 팝업 창 크기 설정
        const popupWidth = 400;
        const popupHeight = 600;


        // 팝업 창 생성
        chrome.windows.create({
            url: chrome.runtime.getURL('src/popup/popup.html'),
            type: 'popup',
            width: popupWidth,
            height: popupHeight,
            focused: true
        }, (window) => {
            // 팝업 창 생성 후 처리
            if (chrome.runtime.lastError) {
                console.error('팝업 창 생성 실패:', chrome.runtime.lastError.message);
                return;
            }
            console.log('조직도 팝업이 열렸습니다.');
        });
    }

    // 이메일 삽입 요청 처리 (팝업에서 메일 주소 선택 시)
    if (request.action === "insertEmail") {
        // 현재 활성화된 탭에 메시지 전송
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "insertEmail",
                    email: request.email
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('이메일 삽입 실패:', chrome.runtime.lastError);
                    } else {
                        console.log('이메일이 성공적으로 삽입되었습니다.');
                    }
                });
            }
        });
    }

    // 에러 처리
    if (request.action === "error") {
        console.error('에러 발생:', request.error);
    }

    // sendResponse가 필요한 경우를 위해 true 반환
    return true;
});

// 브라우저 action 클릭 이벤트 처리 (옵션)
chrome.action.onClicked.addListener((tab) => {
    // Gmail 페이지인지 확인
    if (tab.url.includes('mail.google.com')) {
        console.log('Gmail 페이지에서 확장프로그램이 클릭되었습니다.');
    } else {
        // Gmail이 아닌 페이지에서는 알림 표시
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: '알림',
            message: 'Gmail 페이지에서만 사용할 수 있습니다.'
        });
    }
});