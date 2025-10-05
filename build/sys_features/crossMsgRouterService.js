"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cMRService = void 0;
const rabMqProducer_1 = require("../common/helpers/classes/rabMqProducer");
class CrossMsgRouterService {
    publishMessage(body) {
        // publish to msgrouter exchange
        rabMqProducer_1.producer.publish(body);
    }
}
exports.cMRService = new CrossMsgRouterService();
