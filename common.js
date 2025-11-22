document.addEventListener('DOMContentLoaded', (event) => {
    const ERROR_STATUS_CODES = [400, 401, 403, 404, 500];

    const CONFIG = {
        MS_LOADING_INDICATOR_DELAY: 100,
        MS_DISABLE_TRIGGER_BUTTON: 500,
        MS_DURATION_DISPLAY_POPOVER: 3000,
        MS_DURATION_DISPLAY_ERROR_ALERT: 7000,
        MS_FILE_UPLOAD_RESET_TIMEOUT: 1500
    };

    const HX = Object.freeze({
        ENABLE: 'hx-enable',
        DISABLE: 'hx-disable',
        REQUIRE: 'hx-require',
    });

    const VERSION = "3.08";

    console.log("version %s", VERSION);

    let loadingIndicatorTimeout;
    let isInitialLoad = true; // Flag to track initial page load

    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10000;font-family:Material Symbols Outlined;font-size:48px;color:rgba(0,0,0,.8);padding:10px 20px;background-color:hsl(48,85%,26%);border-radius:5px;box-shadow:0 0 10px rgba(0,0,0,.5);display:none;';
    loadingIndicator.textContent = 'sync';
    document.body.appendChild(loadingIndicator);

    function showLoadingIndicator() {
        loadingIndicatorTimeout = setTimeout(() => {
            loadingIndicator.style.display = 'block';
        }, CONFIG.MS_LOADING_INDICATOR_DELAY);
    }

    function hideLoadingIndicator() {
        clearTimeout(loadingIndicatorTimeout);
        loadingIndicator.style.display = 'none';
    }

    const baseElement = document.createElement('base');
    baseElement.href = `${window.location.origin}/`;
    document.head.appendChild(baseElement);

    function parseString(inputString, elements) {
        let parts = inputString.split('|');
        let matchedElementsMap = new Map();

        for (let part of parts) {
            for (let element of elements) {
                if (element && element.id && part.includes(`id="${element.id}"`)) {
                    matchedElementsMap.set(element.id, part);
                    break;
                }
            }
        }

        return matchedElementsMap;
    }

    function showPopover(element, message) {
        const popover = document.createElement('div');
        popover.className = 'popover';
        popover.textContent = message;
        document.body.appendChild(popover);

        const rect = element.getBoundingClientRect();
        popover.style.left = `${rect.left + window.scrollX}px`;
        popover.style.top = `${rect.bottom + window.scrollY}px`;
        popover.style.zIndex = '1000';

        setTimeout(() => {
            document.body.removeChild(popover);
        }, CONFIG.MS_DURATION_DISPLAY_POPOVER);
    }

    function showErrorAlert(message) {
        const errorAlertBox = document.createElement('div');
        errorAlertBox.className = 'error-alert';
        errorAlertBox.textContent = message;

        document.body.appendChild(errorAlertBox);

        setTimeout(() => {
            document.body.removeChild(errorAlertBox);
        }, CONFIG.MS_DURATION_DISPLAY_ERROR_ALERT);
    }

    function toggleElements(attribute, shouldEnable, triggeringElement) {
        if (!attribute) return;

        const ids = attribute.split(',').map(id => id.trim());
        ids.forEach(
            id => {
                const element = document.querySelector(id);
                if (element) {
                    if (attribute.startsWith('hx-onchange-enable')) {
                        element.disabled = triggeringElement.disabled;
                    } else {
                        element.disabled = !shouldEnable;
                    }
                }
            },
        );
    }

    const validateLength = (element, showPopup = true) => {
        const minLength = element.getAttribute('hx-min') ? parseInt(element.getAttribute('hx-min'), 10) : null;
        const maxLength = element.getAttribute('hx-max') ? parseInt(element.getAttribute('hx-max'), 10) : null;
        const targetDisableId = element.getAttribute('hx-vdisable');
        const targetElement = targetDisableId ? document.querySelector(targetDisableId) : null;
        const valueLength = element.value.length;

        let isValid = true;

        if (minLength !== null && valueLength < minLength) {
            if (showPopup && !isInitialLoad) {
                const elementName = element.name ? element.name.charAt(0).toUpperCase() + element.name.slice(1) : "Element";
                showPopover(element, `${elementName}: Minimum length is ${minLength} characters.`);
            }
            isValid = false;
        }
        if (maxLength !== null && valueLength > maxLength) {
            if (showPopup && !isInitialLoad) {
                const elementName = element.name ? element.name.charAt(0).toUpperCase() + element.name.slice(1) : "Element";
                showPopover(element, `${elementName}: Maximum length is ${maxLength} characters.`);
            }
            isValid = false;
        }

        if (targetElement) {
            targetElement.disabled = !isValid;
        }

        return isValid;
    };

    function validatePasswords(elementPw1, elementPw2, targetElement, showMatchPopup = false) {
        const validLengthPw1 = validateLength(elementPw1, false); // Silent length validation
        const validLengthPw2 = validateLength(elementPw2, false); // Silent length validation
        const passwordsMatch = elementPw1.value === elementPw2.value;
        const bothFilled = elementPw1.value.length > 0 && elementPw2.value.length > 0;

        if (showMatchPopup && bothFilled && !passwordsMatch) {
            showPopover(elementPw2, 'Passwords must match');
            targetElement.disabled = true;
            return false;
        }

        const isValid = validLengthPw1 && validLengthPw2 && passwordsMatch && bothFilled;
        targetElement.disabled = !isValid;
        return isValid;
    }

    const validateRequirements = (element, form = null) => {
        const requireAttr = element.getAttribute('hx-require');
        if (requireAttr) {
            const requiredIds = requireAttr.split(',');

            for (let id of requiredIds) {
                const requiredElement = document.querySelector(id.trim());
                if (requiredElement && !requiredElement.value) {
                    showPopover(requiredElement, 'This field is required.');
                    return false;
                }
            }
        }

        let allValid = true;

        const lengthElements = form.querySelectorAll('[hx-min], [hx-max]');
        lengthElements.forEach(
            (el) => {
                if (!validateLength(el, true)) { // Show length popovers on submission
                    allValid = false;
                }
            },
        );

        const passwordGroups = new Set();

        form.querySelectorAll('[hx-pdisable]').forEach(
            (el) => {
                const pdisableValue = el.getAttribute('hx-pdisable');

                if (!passwordGroups.has(pdisableValue)) {
                    passwordGroups.add(pdisableValue);

                    const ids = pdisableValue.split(',').map(id => id.trim());
                    if (ids.length === 3) {
                        const [idPw1, idPw2, idTarget] = ids;
                        const pw1 = document.querySelector(idPw1);
                        const pw2 = document.querySelector(idPw2);
                        const target = document.querySelector(idTarget);

                        if (pw1 && pw2 && target && !validatePasswords(pw1, pw2, target, true)) { // Show mismatch on submission
                            allValid = false;
                        }
                    }
                }
            },
        );

        return allValid;
    };

    const handleAjax = (element, form, file = null) => {
        const hxEnable = element.getAttribute('hx-enable');
        if (hxEnable) {
            toggleElements(hxEnable, true);
        }

        const hxDisable = element.getAttribute('hx-disable');
        if (hxDisable) {
            toggleElements(hxDisable, false);
        }

        const method = element.hasAttribute('hx-get') ? 'GET' : 'POST';
        const endpoint = element.getAttribute('hx-get') ||
            element.getAttribute('hx-post') ||
            element.getAttribute('hx-upload');
        const targetSelectors = element.getAttribute('hx-swap');
        const targetElements = targetSelectors ? targetSelectors.split(',').map(selector => document.querySelector(selector.trim())) : [];
        const redirectUrl = element.getAttribute('hx-redirect');

        let fetchOptions = { method };
        const formData = new FormData(form);

        element.disabled = true;

        setTimeout(() => {
            element.disabled = false;
        }, CONFIG.MS_DISABLE_TRIGGER_BUTTON);

        if (method === 'POST') {
            if (!validateRequirements(element, form)) {
                return;
            }

            const hxSend = element.getAttribute('hx-send');
            if (hxSend) {
                const ids = hxSend.split(',').map(id => id.trim());
                ids.forEach(
                    id => {
                        const elem = document.querySelector(id);
                        if (elem) {
                            let value = '';
                            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(elem.tagName)) {
                                value = elem.value;
                            } else {
                                value = elem.innerText || elem.textContent;
                            }
                            formData.append(elem.id, value);
                        }
                    },
                );
            }
            fetchOptions.body = formData;
        }

        if (method === 'POST' && element.hasAttribute('hx-upload')) {
            if (!file) {
                return;
            }

            formData.append('file', file);
            fetchOptions.body = formData;

            const xhr = new XMLHttpRequest();
            xhr.open('POST', endpoint, true);

            xhr.upload.addEventListener(
                'progress',
                (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        console.log(`File upload progress: ${percentComplete}%`);
                        const progressEvent = new CustomEvent('file-upload-progress', { detail: percentComplete });
                        element.dispatchEvent(progressEvent);
                    }
                }
            );

            xhr.onload = () => {
                hideLoadingIndicator();
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (redirectUrl) {
                        window.location.href = redirectUrl;
                    } else {
                        const data = xhr.responseText;
                        if (data) {
                            let extractedHTML = parseString(data, targetElements);
                            targetElements.forEach(
                                (targetElement) => {
                                    if (targetElement) {
                                        const responseElement = extractedHTML.get(targetElement.id);
                                        if (responseElement) {
                                            targetElement.outerHTML = responseElement;
                                        }
                                    }
                                },
                            );
                        }
                    }
                } else if (ERROR_STATUS_CODES.includes(xhr.status)) {
                    showErrorAlert(xhr.responseText);
                } else {
                    console.error('Error:', xhr.statusText);
                }
            };

            xhr.onerror = () => {
                hideLoadingIndicator();
                console.error('Error:', xhr.statusText);
            };

            showLoadingIndicator();
            xhr.send(formData);

            return;
        }

        showLoadingIndicator();
        fetch(endpoint, fetchOptions)
            .then(
                response => {
                    if (response.ok && redirectUrl) {
                        window.location.href = redirectUrl;
                        return null;
                    } else if (!response.ok && ERROR_STATUS_CODES.includes(response.status)) {
                        return response.text().then(text => { throw new Error(text); });
                    } else {
                        return response.text();
                    }
                }
            )
            .then(
                data => {
                    hideLoadingIndicator();
                    if (data) {
                        let extractedHTML = parseString(data, targetElements);
                        targetElements.forEach((targetElement) => {
                            if (targetElement) {
                                const responseElement = extractedHTML.get(targetElement.id);
                                if (responseElement) {
                                    targetElement.outerHTML = responseElement;
                                    reattachEventListeners(targetElement);
                                }
                            }
                        });
                    }
                }
            )
            .catch(
                error => {
                    hideLoadingIndicator();
                    let elementId = error.message.match(/ID '(.+?)'/)?.[1];
                    if (elementId) {
                        console.error(`Error with element ID '${elementId}':`, error);
                        showErrorAlert(`Error with element ID '${elementId}': ${error.message}`);
                    } else {
                        console.error('Error:', error);
                        showErrorAlert(error.message);
                    }
                }
            );
    };

    const handleButtonClick = (event) => {
        event.preventDefault();
        const element = event.currentTarget;
        const form = element.closest('form') || document.createElement('form');

        handleAjax(element, form);
        handleHxShowHide(element, 'hx-show');
        handleHxShowHide(element, 'hx-hide');
    };

    const handleSelectChange = (event) => {
        const element = event.currentTarget;
        const form = document.createElement('form');

        let hiddenInput = form.querySelector('input[name="selectedOption"]');
        if (!hiddenInput) {
            hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = 'selectedOption';
            form.appendChild(hiddenInput);
        }
        hiddenInput.value = element.value;
        handleAjax(element, form);
    };

    const handleUploadClick = (event) => {
        event.preventDefault();
        const element = event.currentTarget;
        const form = element.closest('form') || document.createElement('form');

        if (!validateRequirements(element, form)) {
            return;
        }

        let fileInput = form.querySelector('input[type="file"]');
        if (!fileInput) {
            fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.name = 'file';
            fileInput.style.display = 'none';
            form.appendChild(fileInput);

            fileInput.addEventListener('change', function () {
                const fileUploaded = fileInput.files[0];
                handleAjax(element, form, fileUploaded);
            }, { once: true });

            fileInput.click();
        } else {
            const fileUploaded = fileInput.files[0];
            handleAjax(element, form, fileUploaded);
        }
    };

    const handleDblClickClear = (event) => {
        if (event.target.tagName.toLowerCase() === 'button' || event.target.getElementsByTagName('button').length > 0) {
            return;
        }

        const searchItem = event.currentTarget;
        const elInputs = searchItem.querySelectorAll('input, select');

        for (let input of elInputs) {
            if (input.tagName.toLowerCase() === 'input') {
                input.value = '';
            } else if (input.tagName.toLowerCase() === 'select') {
                input.selectedIndex = 0;
            }
        }
    };

    function applyShowHide(targetSelector, timeToShow, cssTransitionClass, isShow) {
        const targetElement = document.querySelector(targetSelector);
        if (!targetElement) return;

        if (cssTransitionClass) {
            targetElement.classList.add(cssTransitionClass);
        }

        if (isShow) {
            targetElement.style.display = 'block';
            if (timeToShow > 0) {
                setTimeout(() => {
                    targetElement.style.display = 'none';
                    if (cssTransitionClass) {
                        targetElement.classList.remove(cssTransitionClass);
                    }
                }, timeToShow);
            }
        } else {
            targetElement.style.display = 'none';
            if (cssTransitionClass) {
                targetElement.classList.remove(cssTransitionClass);
            }
        }
    }

    function handleHxShowHide(element, attributeName) {
        const attributeValue = element.getAttribute(attributeName);
        if (!attributeValue) return;

        const targets = attributeValue.split(',').map(target => target.trim());
        targets.forEach(
            targetSpec => {
                const parts = targetSpec.split(':');
                if (parts.length >= 1) {
                    const targetSelector = parts[0];
                    const timeToShow = parts.length > 1 ? parseInt(parts[1], 10) : 0;
                    const cssTransitionClass = parts.length > 2 ? parts[2] : '';
                    applyShowHide(targetSelector, timeToShow, cssTransitionClass, attributeName === 'hx-show');
                }
            },
        );
    }

    function handleHxShowOnLoad(element, attributeName) {
        const attributeValue = element.getAttribute(attributeName);
        if (!attributeValue) return;

        const targets = attributeValue.split(',').map(target => target.trim());
        targets.forEach(
            targetSpec => {
                const parts = targetSpec.split(':');
                if (parts.length >= 1) {
                    const targetSelector = parts[0];
                    const timeToShow = parts.length > 1 ? parseInt(parts[1], 10) : 0;
                    const cssTransitionClass = parts.length > 2 ? parts[2] : '';
                    applyShowHide(targetSelector, timeToShow, cssTransitionClass, attributeName === 'hx-show-onload');
                }
            },
        );
    }

    const reattachEventListeners = (element) => {
        if (!element) return;

        if (element.matches('[hx-show], [hx-hide]')) {
            handleHxShowHide(element, 'hx-show');
            handleHxShowHide(element, 'hx-hide');
        }

        if (element.matches('button[hx-get], button[hx-post], a[hx-get], a[hx-post]')) {
            element.addEventListener('click', handleButtonClick);
        }

        if (element.matches('button[hx-upload], a[hx-upload]')) {
            element.addEventListener('click', handleUploadClick);
        }

        if (element.matches('select[hx-get], select[hx-post]')) {
            element.addEventListener('change', handleSelectChange);
        }

        if (element.id === 'items-search') {
            element.addEventListener('dblclick', handleDblClickClear);
        }

        element.querySelectorAll('[hx-show], [hx-hide]').forEach(
            el => {
                handleHxShowHide(el, 'hx-show');
                handleHxShowHide(el, 'hx-hide');
            },
        );

        element.querySelectorAll('button[hx-get], button[hx-post], a[hx-get], a[hx-post]').forEach(
            el => {
                el.addEventListener('click', handleButtonClick);
            },
        );

        element.querySelectorAll('button[hx-upload], a[hx-upload]').forEach(
            el => {
                el.addEventListener('click', handleUploadClick);
            },
        );

        element.querySelectorAll('select[hx-get], select[hx-post]').forEach(
            el => {
                el.addEventListener('change', handleSelectChange);
            },
        );

        const searchItem = element.querySelector('#items-search');
        if (searchItem) {
            searchItem.addEventListener('dblclick', handleDblClickClear);
        }
    };

    document.querySelectorAll('[hx-show], [hx-hide]').forEach(
        el => {
            handleHxShowHide(el, 'hx-show');
            handleHxShowHide(el, 'hx-hide');
        },
    );

    document.querySelectorAll('[hx-show-onload]').forEach(
        el => {
            handleHxShowOnLoad(el, 'hx-show-onload');
        },
    );

    const processedGroups = new Set();

    document.querySelectorAll('[hx-pdisable]').forEach(
        (element) => {
            const pdisableValue = element.getAttribute('hx-pdisable');
            if (processedGroups.has(pdisableValue)) return;

            processedGroups.add(pdisableValue);

            const ids = pdisableValue.split(',').map(id => id.trim());
            if (ids.length !== 3) return;

            const [pw1Id, pw2Id, targetId] = ids;
            const pw1Element = document.querySelector(pw1Id);
            const pw2Element = document.querySelector(pw2Id);
            const targetElement = document.querySelector(targetId);

            if (!pw1Element || !pw2Element || !targetElement) return;

            targetElement.disabled = true;

            const validateBothTyping = () => {
                validatePasswords(pw1Element, pw2Element, targetElement, false);
                isInitialLoad = false; // Reset flag after first interaction
            };

            const validateBothBlur = () => {
                validatePasswords(pw1Element, pw2Element, targetElement, true); // Only show mismatch popover
                isInitialLoad = false; // Reset flag after first interaction
            };

            pw1Element.addEventListener('input', validateBothTyping);
            pw2Element.addEventListener('input', validateBothTyping);
            pw1Element.addEventListener('blur', validateBothBlur);
            pw2Element.addEventListener('blur', validateBothBlur);

            // Initial validation without popovers
            validatePasswords(pw1Element, pw2Element, targetElement, false);
        },
    );

    const elementsWithoutUpload = document.querySelectorAll('button[hx-get], button[hx-post], a[hx-get], a[hx-post]');
    elementsWithoutUpload.forEach(
        el => el.addEventListener('click', handleButtonClick)
    );

    const elementsWithUpload = document.querySelectorAll('button[hx-upload], a[hx-upload]');
    elementsWithUpload.forEach(
        el => el.addEventListener('click', handleUploadClick)
    );

    const elementsSelect = document.querySelectorAll('select[hx-get], select[hx-post]');
    elementsSelect.forEach(
        el => el.addEventListener('change', handleSelectChange)
    );

    const searchItems = document.getElementById('items-search');
    if (searchItems) {
        searchItems.addEventListener('dblclick', handleDblClickClear);
    }

    document.querySelectorAll('[hx-min], [hx-max]').forEach(
        (element) => {
            element.addEventListener('change', () => {
                validateLength(element);
                isInitialLoad = false; // Reset flag after first interaction
            });
        },
    );

    document.querySelectorAll('[hx-onchange-enable]').forEach(
        element => {
            element.addEventListener('change', function () {
                const hxChangeEnable = this.getAttribute('hx-onchange-enable');
                toggleElements(`hx-onchange-enable,${hxChangeEnable}`, false, this);
                isInitialLoad = false; // Reset flag after first interaction
            });
        },
    );

    const observer = new MutationObserver(
        (mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(
                        node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                reattachEventListeners(node);
                            }
                        },
                    );
                }
            }
        },
    );

    observer.observe(document.body, { childList: true, subtree: true });

    function openInNewTab(event) {
        event.preventDefault();
        window.open(event.currentTarget.href, '_blank');
    };

    const links = document.getElementsByClassName('ntab');
    Array.from(links).forEach(
        link => {
            link.addEventListener('click', openInNewTab);
        },
    );
});