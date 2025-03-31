let popupWindowId = null;

// content script나 popup script으로부터의 메시지 처리
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('백그라운드에서 메시지 수신:', message);

    if (message.action === "sendEmailData" || message.action === "sendEmailDataUndo") {
        // Gmail "쓰기" 미니 팝업 창 찾기
        chrome.tabs.query({ url: "*://mail.google.com/*" }, (tabs) => {
            if (tabs.length === 0) {
                sendResponse({ success: false, error: "No Gmail tabs found" });
                return;
            }

            // Gmail 팝업 창에 데이터 삽입 요청
            const gmailTab = tabs[0]; // 첫 번째 Gmail 탭 선택
            chrome.scripting.executeScript(
                {
                    target: { tabId: gmailTab.id },
                    func: insertEmailData,
                    args: [message.data] // 전달할 데이터
                },
                (results) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error executing script:", chrome.runtime.lastError.message);
                        sendResponse({ success: false, error: chrome.runtime.lastError.message });
                    } else {
                        sendResponse({ success: true, result: results });
                    }
                }
            );
        });
        return true;
    }else if(message.action === "openOrgTree"){//조직도 팝업 호출
        handleOpenOrgTree();
        sendResponse({ success: true});
        return true;
    }else{
        console.warn("Unknown action:", request.action);
        sendResponse({ success: false, error: "Unknown action" }); // 기본 응답
    }
    return true;
});//chrome.runtime.onMessage.addListener

// Gmail DOM에 데이터를 삽입하는 함수
function insertEmailData(data) {
    try {
        // window.userList를 배열로 초기화
        if (!Array.isArray(window.userList)) {
            window.userList = [];
        }

        // data의 각 flag(to, cc, bcc)에 대해 이메일 리스트 처리
        Object.keys(data).forEach(flag => {
            const userList = data[flag];  // flag에 해당하는 이메일 리스트
            console.log(`Processing ${flag}:`, userList);

            // 이메일 리스트를 각각의 flag에 맞는 userList로 병합
            let emailList = userList.map(user => user.email);  // 이메일 주소만 추출
            console.log(`emailList:`, emailList);

            // 각 flag에 맞는 필드를 처리
            switch (flag) {
                case 'to':
                    handleFieldInput(null, "input[aria-label='수신자']", emailList, "TO");
                    break;
                case 'cc':
                    handleFieldInput(
                        document.querySelector("span[aria-label='참조 수신자 추가 ‪(Ctrl-Shift-C)‬']"),
                        "input[aria-label='참조 수신자']",
                        emailList,
                        "CC",
                    );
                    break;
                case 'bcc':
                    handleFieldInput(
                        document.querySelector("span[aria-label='숨은참조 수신자 추가 ‪(Ctrl-Shift-B)‬']"),
                        "input[aria-label='숨은참조 수신자']",
                        emailList,
                        "BCC",
                    );
                    break;
                case 'undo':
                    undoFieldInput(); // undo 작업만 수행
                    break;
            }//switch
        });
        // 자동완성 팝업 제거 함수
        function removeAutoCompletePopup() {
            const element = document.querySelector('.afC.mS5Pff');
            if (element) {
                element.remove();
            }
        }

        // 각각의 필드가 DOM에 준비될 때까지 대기하는 함수
        function waitForField(selector, timeout = 5000) {
            return new Promise((resolve, reject) => {
                const startTime = Date.now();

                (function checkField() {
                    const Field = document.querySelector(selector);
                    if (Field) {
                        resolve(Field); // 필드가 준비되면 반환
                    } else if (Date.now() - startTime > timeout) {
                        reject(new Error("Field not found within timeout"));
                    } else {
                        setTimeout(checkField, 100); // 100ms 간격으로 재확인
                    }
                })();
            });
        }

        // undo 작업을 별도의 함수로 분리
        async function undoFieldInput() {
            if (!window.lastInsertedField) return;
            const field = await waitForField(window.lastInsertedField);
            let currentValues = field.value ? field.value.split(",").map(s => s.trim()) : [];

            if (window.lastInsertedUserList) {
                //window.userList에서도 삭제된 값 반영
                window.userList = window.userList.filter(user => !window.lastInsertedUserList.includes(user));
                currentValues = currentValues.filter(user => !window.lastInsertedUserList.includes(user));

                // 화면에서 삭제
                const emailElements = document.querySelectorAll(window.lastInsertedField);
                emailElements.forEach(emailElement => {
                    const email = emailElement.innerText.trim();
                    if (window.lastInsertedUserList.includes(email)) {
                        emailElement.remove(); // 해당 이메일 삭제
                    }
                });

                //lastInsertedUserList 초기화
                window.lastInsertedUserList = [];
                window.lastInsertedField = null;

            }

            field.value = currentValues.join(", ");
            field.dispatchEvent(new Event("input", {bubbles: true}));
            field.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "Enter"}));
            console.log("Undo operation completed:", field.value);

        }//undoFieldInput

        async function handleFieldInput(button, inputSelector, emailList, flagValue) {
            removeAutoCompletePopup();
            // flagValue가 'CC' 또는 'BCC'이고 emailList가 비어있지 않으면 버튼을 클릭
            if ((flagValue === 'CC' || flagValue === 'BCC') && emailList.length > 0 && button) {
                button.click();  // 수신자 목록을 표시하기 위한 버튼 클릭
            }
            try {
                const field = await waitForField(inputSelector);
                let currentValues = field.value ? field.value.split(",").map(s => s.trim()) : [];

                //이전 undo 기록이 남아 있지 않도록 확인
                if (!window.lastInsertedUserList || window.lastInsertedUserList.length === 0) {
                    window.lastInsertedUserList = [];
                }

                // emailList에서 이메일만 추출하여 추가 (중복 제거)
                currentValues = [...new Set([...currentValues, ...emailList])];

                // 필드에 값 설정
                field.value = currentValues.join(", ");
                field.dispatchEvent(new Event("input", {bubbles: true}));
                field.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, key: "Enter"}));

                removeAutoCompletePopup();
                console.log(`${flagValue} data updated:`, field.value);
            } catch (error) {
                console.error(`${flagValue} field error:`, error);
            }
        }//handleFieldInput
    }catch (error) {
        console.error("Error inserting recipient data:", error);
    }
}//insertEmailData

//조직도 팝업을 여는 함수
function handleOpenOrgTree() {
    if (popupWindowId !== null) {
        chrome.windows.remove(popupWindowId, () => {
            console.log("이전 팝업 창 닫음");
        });
    }

    // 새로운 팝업 창 생성
    chrome.windows.create({
        url: "http://localhost:8090", // IntelliJ에서 실행 중인 JSP의 URL
        type: 'popup', // 팝업 창으로 열기
        width: 970, // 원하는 팝업 창 너비
        height: 800, // 원하는 팝업 창 높이
        focused: true
    }, (window) => {
        if (chrome.runtime.lastError) {
            console.error('팝업 창 생성 실패:', chrome.runtime.lastError.message);
            return;
        }
        console.log('JSP 팝업이 열렸습니다. Window ID:', window.id);
    });
}//handleOpenOrgTree


