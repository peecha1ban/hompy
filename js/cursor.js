/*

  ___        _                 _           _   _    _      _       _____
 / _ \      (_)               | |         | | | |  | |    | |     /  __ \
/ /_\ \_ __  _ _ __ ___   __ _| |_ ___  __| | | |  | | ___| |__   | /  \/_   _ _ __ ___  ___  _ __ ___
|  _  | '_ \| | '_ ` _ \ / _` | __/ _ \/ _` | | |/\| |/ _ \ '_ \  | |   | | | | '__/ __|/ _ \| '__/ __|
| | | | | | | | | | | | | (_| | ||  __/ (_| | \  /\  /  __/ |_) | | \__/\ |_| | |  \__ \ (_) | |  \__ \
\_| |_/_| |_|_|_| |_| |_|\__,_|\__\___|\__,_|  \/  \/ \___|_.__/   \____/\__,_|_|  |___/\___/|_|  |___/ (lite)

                                 by @alienmelon (tetrageddon.com)
*/

//---------------PATHS & VARIABLES---------------//

//default path to the folder where the cursors are
//if you change where they are located, be sure to change this...
var str_pathToImageFolder = "cursorImages/";
//
var int_cursorAnimationInterval; // animation interval id for the main document
var num_cursorAnimationFrame = 0; // the animation frame for the main document (counts through arrays)
var num_animationSpeed = 100; // interval speed

// Store interval and frame variables for iframes dynamically
var iframeCursorData = {}; // e.g., { "iframeId1": { interval: id, frame: 0 }, "iframeId2": { interval: id, frame: 0 } }

//---------------HELPER FUNCTIONS---------------//

/**
 * Sets the cursor graphic for a given document's html element.
 * @param {Document} targetDocument The document object (e.g., document or iframe.contentDocument).
 * @param {string} str_image The image filename for the cursor.
 */
function setCursorInDocument(targetDocument, str_image) {
    if (targetDocument && targetDocument.documentElement) {
        targetDocument.documentElement.style.cursor = 'url(' + str_pathToImageFolder + str_image + '), auto';
    }
}

/**
 * Sets the cursor graphic for specific elements within a given document.
 * @param {Document} targetDocument The document object (e.g., document or iframe.contentDocument).
 * @param {string} str_image The image filename for the cursor.
 * @param {string} str_tagName The HTML tag name (e.g., "a", "div").
 */
function setCursorToTagInDocument(targetDocument, str_image, str_tagName) {
    if (targetDocument) {
        var _elements = targetDocument.getElementsByTagName(str_tagName);
        for (var i = 0; i < _elements.length; ++i) {
            _elements[i].style.cursor = 'url(' + str_pathToImageFolder + str_image + '), auto';
        }
    }
}

/**
 * Animates the cursor for a given document.
 * @param {Array<string>} arr_animation An array of image filenames for the animation sequence.
 * @param {Document} targetDocument The document object to apply the animation to.
 * @param {string} frameVarName The name of the variable storing the current animation frame for this document.
 */
function animateCursorDefaultInDocument(arr_animation, targetDocument, frameVarName) {
    if (!targetDocument || !targetDocument.defaultView) { // Ensure defaultView exists for window properties
        return;
    }

    // Get the current frame number, defaulting to 0 if not set
    let currentFrame = targetDocument.defaultView[frameVarName] || 0;

    currentFrame += 1;
    if (currentFrame > arr_animation.length - 1) {
        currentFrame = 0;
    }

    // Store the updated frame number back
    targetDocument.defaultView[frameVarName] = currentFrame;

    setCursorInDocument(targetDocument, arr_animation[currentFrame]);
}

/**
 * Animates the cursor for specific elements within a given document.
 * @param {Array<string>} arr_animation An array of image filenames for the animation sequence.
 * @param {string} str_tagName The HTML tag name (e.g., "a", "div").
 * @param {Document} targetDocument The document object to apply the animation to.
 * @param {string} frameVarName The name of the variable storing the current animation frame for this document.
 */
function animatedCursorForElementInDocument(arr_animation, str_tagName, targetDocument, frameVarName) {
    if (!targetDocument || !targetDocument.defaultView) { // Ensure defaultView exists for window properties
        return;
    }

    let currentFrame = targetDocument.defaultView[frameVarName] || 0;

    currentFrame += 1;
    if (currentFrame > arr_animation.length - 1) {
        currentFrame = 0;
    }

    targetDocument.defaultView[frameVarName] = currentFrame;

    setCursorToTagInDocument(targetDocument, arr_animation[currentFrame], str_tagName);
}


//---------------CALL THESE---------------//

/**
 * Animate cursor for the page's body (main document).
 * @param {Array<string>} arr_animation An array of image filenames.
 */
function animateCursor(arr_animation) {
    num_cursorAnimationFrame = 0;
    clearInterval(int_cursorAnimationInterval);
    int_cursorAnimationInterval = setInterval(function() {
        animateCursorDefaultInDocument(arr_animation, document, "num_cursorAnimationFrame");
    }, num_animationSpeed);
}

/**
 * Animate cursor for specific elements on the page (main document).
 * @param {Array<string>} arr_animation An array of image filenames.
 * @param {string} str_tagName The HTML tag name.
 */
function animateCursorForElement(arr_animation, str_tagName) {
    // This function originally used dynamic global variables which is problematic for multiple iframes.
    // For the main document, we'll keep the existing pattern.
    num_cursorAnimationFrame = 0; // This might conflict if used for element-specific animations on main document previously.
    clearInterval(window["int_cursorAnimationInterval_" + str_tagName]);
    window["num_cursorAnimationFrame_" + str_tagName] = 0; // Specific frame counter for this tag type on main doc
    window["int_cursorAnimationInterval_" + str_tagName] = setInterval(function() {
        animatedCursorForElementInDocument(arr_animation, str_tagName, document, "num_cursorAnimationFrame_" + str_tagName);
    }, num_animationSpeed);
}

/**
 * Set a static (non-moving) cursor for the main document.
 * @param {string} str_image The image filename.
 */
function staticCursor(str_image) {
    num_cursorAnimationFrame = 0;
    clearInterval(int_cursorAnimationInterval);
    setCursorInDocument(document, str_image);
}

/**
 * Set a static cursor for a specific tag on the main document.
 * @param {string} str_image The image filename.
 * @param {string} str_tagName The HTML tag name.
 */
function staticCursorForElement(str_image, str_tagName) {
    num_cursorAnimationFrame = 0;
    clearInterval(window["int_cursorAnimationInterval_" + str_tagName]);
    setCursorToTagInDocument(document, str_image, str_tagName);
}

//---------------NEW FUNCTIONS FOR IFRAMES---------------//

/**
 * Helper to apply animated cursor to a single iframe.
 * Moved outside the loop to satisfy JSHint W083.
 * @param {HTMLIFrameElement} iframe The specific iframe element.
 * @param {Array<string>} arr_animation An array of image filenames.
 * @param {string} frameVarPrefix A prefix for the frame variable name to ensure uniqueness.
 * @param {string|null} tagName Optional: The HTML tag name if applying to specific elements within the iframe.
 */
function _applyCursorToSingleIframe(iframe, arr_animation, frameVarPrefix, tagName = null) {
    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
            const iframeId = iframe.id || `iframe_${Math.random().toString(36).substr(2, 9)}`; // Unique ID for iframe
            iframe.id = iframeId; // Assign ID if not present

            if (tagName) { // For element-specific animation within iframe
                const frameVarName = `${frameVarPrefix}_iframe_${iframeId}_${tagName}`;
                // Initialize/clear data for this iframe's tag-specific animation
                if (!iframeCursorData[iframeId]) {
                    iframeCursorData[iframeId] = {};
                }
                if (iframeCursorData[iframeId][tagName + '_interval']) {
                    clearInterval(iframeCursorData[iframeId][tagName + '_interval']);
                }
                iframeDoc.defaultView[frameVarName] = 0; // Reset frame for this tag type

                iframeCursorData[iframeId][tagName + '_interval'] = setInterval(function() {
                    animatedCursorForElementInDocument(arr_animation, tagName, iframeDoc, frameVarName);
                }, num_animationSpeed);

            } else { // For whole-iframe animation
                const frameVarName = `${frameVarPrefix}_iframe_${iframeId}`;
                // Initialize/clear data for this iframe's general animation
                if (!iframeCursorData[iframeId]) {
                    iframeCursorData[iframeId] = {
                        frame: 0,
                        interval: null
                    };
                }
                clearInterval(iframeCursorData[iframeId].interval);
                iframeCursorData[iframeId].frame = 0; // Reset frame
                iframeDoc.defaultView[frameVarName] = 0; // Also reset the variable on iframe.defaultView

                iframeCursorData[iframeId].interval = setInterval(function() {
                    animateCursorDefaultInDocument(arr_animation, iframeDoc, frameVarName);
                }, num_animationSpeed);
            }
        }
    } catch (e) {
        console.warn(`Could not apply cursor to iframe (ID: ${iframe.id}) due to Same-Origin Policy or other error:`, e);
    }
}

/**
 * Helper to set static cursor to a single iframe.
 * Moved outside the loop to satisfy JSHint W083.
 * @param {HTMLIFrameElement} iframe The specific iframe element.
 * @param {string} str_image The image filename.
 */
function _setStaticCursorToSingleIframe(iframe, str_image) {
    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
            const iframeId = iframe.id || `iframe_${Math.random().toString(36).substr(2, 9)}`;
            iframe.id = iframeId;

            // Clear any existing animation for this iframe
            if (iframeCursorData[iframeId]) {
                if (iframeCursorData[iframeId].interval) {
                    clearInterval(iframeCursorData[iframeId].interval);
                    iframeCursorData[iframeId].interval = null;
                }
                // Also clear any element-specific intervals for this iframe
                for (const key in iframeCursorData[iframeId]) {
                    if (key.endsWith('_interval')) {
                        clearInterval(iframeCursorData[iframeId][key]);
                        delete iframeCursorData[iframeId][key]; // Clean up
                    }
                }
            }
            setCursorInDocument(iframeDoc, str_image);
        }
    } catch (e) {
        console.warn(`Could not set static cursor for iframe (ID: ${iframe.id}) due to Same-Origin Policy or other error:`, e);
    }
}


/**
 * Animate cursor for a specific iframe or all iframes.
 * IMPORTANT: This will only work if the iframe content is from the same origin.
 * @param {Array<string>} arr_animation An array of image filenames.
 * @param {HTMLIFrameElement|null} iframeElement Optional: The specific iframe element to apply to. If null, applies to all same-origin iframes.
 */
function animateCursorForIframe(arr_animation, iframeElement = null) {
    const processIframe = (iframe) => {
        // Attach onload listener to ensure content is loaded.
        // This will run when the iframe's content is fully loaded.
        iframe.onload = () => _applyCursorToSingleIframe(iframe, arr_animation, "num_cursorAnimationFrame_iframe");
        // If the iframe is already loaded, apply the cursor immediately without waiting for onload
        if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
            _applyCursorToSingleIframe(iframe, arr_animation, "num_cursorAnimationFrame_iframe");
        }
    };

    if (iframeElement) {
        processIframe(iframeElement);
    } else {
        const iframes = document.getElementsByTagName('iframe');
        for (let i = 0; i < iframes.length; i++) {
            processIframe(iframes[i]);
        }
    }
}

/**
 * Set a static cursor for a specific iframe or all iframes.
 * IMPORTANT: This will only work if the iframe content is from the same origin.
 * @param {string} str_image The image filename.
 * @param {HTMLIFrameElement|null} iframeElement Optional: The specific iframe element to apply to. If null, applies to all same-origin iframes.
 */
function staticCursorForIframe(str_image, iframeElement = null) {
    const processIframe = (iframe) => {
        iframe.onload = () => _setStaticCursorToSingleIframe(iframe, str_image);
        if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
            _setStaticCursorToSingleIframe(iframe, str_image);
        }
    };

    if (iframeElement) {
        processIframe(iframeElement);
    } else {
        const iframes = document.getElementsByTagName('iframe');
        for (let i = 0; i < iframes.length; i++) {
            processIframe(iframes[i]);
        }
    }
}

/**
 * Animate cursor for specific elements within a specific iframe or all iframes.
 * IMPORTANT: This will only work if the iframe content is from the same origin.
 * @param {Array<string>} arr_animation An array of image filenames.
 * @param {string} str_tagName The HTML tag name (e.g., "a", "div").
 * @param {HTMLIFrameElement|null} iframeElement Optional: The specific iframe element to apply to. If null, applies to all same-origin iframes.
 */
function animateCursorForElementInIframe(arr_animation, str_tagName, iframeElement = null) {
    const processIframe = (iframe) => {
        iframe.onload = () => _applyCursorToSingleIframe(iframe, arr_animation, "num_cursorAnimationFrame_iframe_element", str_tagName);
        if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
            _applyCursorToSingleIframe(iframe, arr_animation, "num_cursorAnimationFrame_iframe_element", str_tagName);
        }
    };

    if (iframeElement) {
        processIframe(iframeElement);
    } else {
        const iframes = document.getElementsByTagName('iframe');
        for (let i = 0; i < iframes.length; i++) {
            processIframe(iframes[i]);
        }
    }
}


//---------------ON PAGE LOAD, CUSTOMIZE THIS...---------------//

//customize this with your desired functions
//this starts the cursor when the page loads...
//if you want to have the cursor start another way, then comment this out
window.addEventListener("load", function() {

    //make a theme here!
    //see https://www.w3schools.com/tags/ for a list of all elements

    //note that everything must be passed as an array, so the brakets ['...'] are important.

    // Apply to the main document
    animateCursor(['snoopy-frame1.png', 'snoopy-frame2.png']);

    // Example: Apply a static cursor to a specific iframe (replace 'myIframeId' with your iframe's ID)
    // const mySpecificIframe = document.getElementById('myIframeId');
    // if (mySpecificIframe) {
    //     staticCursorForIframe('Custom/sparkle/CursorStarSparkle-frame1.png', mySpecificIframe);
    // }

    // Example: Animate cursors for all same-origin iframes
    animateCursorForIframe(['snoopy-frame1.png', 'snoopy-frame2.png']);

    // Example: Animate cursors for 'li' tags within all same-origin iframes
    // animateCursorForElementInIframe(['Custom/sparkle/CursorStarSparkle-frame1.png', 'Custom/sparkle/CursorStarSparkle-frame2.png', 'Custom/sparkle/CursorStarSparkle-frame3.png', 'Custom/sparkle/CursorStarSparkle-frame4.png', 'Custom/sparkle/CursorStarSparkle-frame5.png', 'Custom/sparkle/CursorStarSparkle-frame6.png', 'Custom/sparkle/CursorStarSparkle-frame7.png', 'Custom/sparkle/CursorStarSparkle-frame8.png', 'Custom/sparkle/CursorStarSparkle-frame9.png', 'Custom/sparkle/CursorStarSparkle-frame10.png', 'Custom/sparkle/CursorStarSparkle-frame11.png', 'Custom/sparkle/CursorStarSparkle-frame12.png', 'Custom/sparkle/CursorStarSparkle-frame13.png', 'Custom/sparkle/CursorStarSparkle-frame14.png', 'Custom/sparkle/CursorStarSparkle-frame15.png', 'Custom/sparkle/CursorStarSparkle-frame16.png', 'Custom/sparkle/CursorStarSparkle-frame17.png', 'Custom/sparkle/CursorStarSparkle-frame18.png', 'Custom/sparkle/CursorStarSparkle-frame19.png', 'Custom/sparkle/CursorStarSparkle-frame20.png'], "li");

    // Existing examples for main document (uncomment to use)
    // animateCursorForElement(['Custom/sparkle/CursorStarSparkle-frame1.png', 'Custom/sparkle/CursorStarSparkle-frame2.png', 'Custom/sparkle/CursorStarSparkle-frame3.png', 'Custom/sparkle/CursorStarSparkle-frame4.png', 'Custom/sparkle/CursorStarSparkle-frame5.png', 'Custom/sparkle/CursorStarSparkle-frame6.png', 'Custom/sparkle/CursorStarSparkle-frame7.png', 'Custom/sparkle/CursorStarSparkle-frame8.png', 'Custom/sparkle/CursorStarSparkle-frame9.png', 'Custom/sparkle/CursorStarSparkle-frame10.png', 'Custom/sparkle/CursorStarSparkle-frame11.png', 'Custom/sparkle/CursorStarSparkle-frame12.png', 'Custom/sparkle/CursorStarSparkle-frame13.png', 'Custom/sparkle/CursorStarSparkle-frame14.png', 'Custom/sparkle/CursorStarSparkle-frame15.png', 'Custom/sparkle/CursorStarSparkle-frame16.png', 'Custom/sparkle/CursorStarSparkle-frame17.png', 'Custom/sparkle/CursorStarSparkle-frame18.png', 'Custom/sparkle/CursorStarSparkle-frame19.png', 'Custom/sparkle/CursorStarSparkle-frame20.png'], "li");
    // animateCursorForElement(['Custom/cupcakecursor/cupcakecursor_frame1.png', 'Custom/cupcakecursor/cupcakecursor_frame2.png', 'Custom/cupcakecursor/cupcakecursor_frame3.png'], "strong");
    // animateCursorForElement(['Custom/snoopy-frame1.png', 'Custom/snoopy-frame2.png'], "h1");
    // animateCursorForElement(['Custom/snoopy-frame1.png', 'Custom/snoopy-frame2.png'], "a");
});