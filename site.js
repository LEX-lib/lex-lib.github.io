import {createApp, nextTick, reactive} from "https://esm.sh/petite-vue@0.4.1";
import jump from "https://esm.sh/jump.js@1.0.2";

const navigationStore = reactive({
    jumpToAbout : function() {
        jump(document.getElementById('about-me-section'), {
            duration: 200,
            offset : -25
        });
    },
});

createApp({ navigationStore }).mount('#navigation-bar');