import expectThrow from './expectThrow'
import expectEvent from './expectEvent'
import equalBig from './equalBig'

export default (() => {
    return {
        expectThrow: expectThrow,
        expectEvent: expectEvent,
        equalBig: equalBig
    };
})();