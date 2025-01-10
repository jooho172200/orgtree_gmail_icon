let popupWindowId = null;

// 확장프로그램이 설치되거나 업데이트될 때 실행
chrome.runtime.onInstalled.addListener(() => {
    console.log('조직도 확장프로그램이 설치/업데이트 되었습니다.');
});

// content script나 팝업으로부터의 메시지 처리
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('백그라운드에서 메시지 수신:', request);

    // 조직도 팝업 열기 요청 처리
    if (request.action === "openOrgTree") {
        if (popupWindowId !== null) {
            chrome.windows.remove(popupWindowId, () => {
                console.log("이전 팝업 창 닫음");
            });
        }

        const popupWidth = 400;
        const popupHeight = 600;

        chrome.windows.create({
            url: chrome.runtime.getURL('src/popup/popup.html'),
            type: 'popup',
            width: popupWidth,
            height: popupHeight,
            focused: true
        }, (window) => {
            if (chrome.runtime.lastError) {
                console.error('팝업 창 생성 실패:', chrome.runtime.lastError.message);
                return;
            }else {
                console.log('조직도 팝업이 열렸습니다.');
                popupWindowId = window.id; // 팝업 창 ID 저장
            }
        });
    }

    // 이메일 삽입 요청 처리
    if (request.action === "insertEmailToPopup") {
        console.log('이메일 삽입 요청 받음:', request.email);

        // 현재 Gmail 메일쓰기 탭 찾기
        chrome.tabs.query({ url: '*://mail.google.com/*' }, (tabs) => {

            if (tabs.length === 0) {
                console.error('Gmail 메일쓰기 탭을 찾을 수 없습니다.');
                sendResponse({ error: 'Gmail 메일쓰기 탭을 찾을 수 없습니다.' });
                return;
            }

            const gmailTabId = tabs[0].id;
            console.log('Gmail 메일쓰기 탭 ID:', gmailTabId);

            // Gmail 메일쓰기 탭에 메시지 전송
            chrome.tabs.sendMessage(
                gmailTabId,
                {
                    action: "insertEmail",
                    email: request.email
                },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('메시지 전송 중 오류:', chrome.runtime.lastError.message);
                        sendResponse({ error: chrome.runtime.lastError.message });
                        return;
                    }
                    console.log('Gmail에 이메일 삽입 성공:', response);
                    sendResponse({ success: true });

                }
            );
        });
        return true; // 비동기 응답을 위해 필요
    }

    // 팝업 창 닫기 요청 처리
    if (request.action === "closePopup" && popupWindowId !== null) {
        chrome.windows.remove(popupWindowId, () => {
            console.log("팝업 창이 닫혔습니다.");
            popupWindowId = null;
        });
    }

});//chrome.runtime.onMessage.addListener