"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MentorshipModule = void 0;
const common_1 = require("@nestjs/common");
const mentorship_controller_1 = require("./mentorship.controller");
const mentorship_service_1 = require("./mentorship.service");
let MentorshipModule = class MentorshipModule {
};
exports.MentorshipModule = MentorshipModule;
exports.MentorshipModule = MentorshipModule = __decorate([
    (0, common_1.Module)({
        controllers: [mentorship_controller_1.MentorshipController],
        providers: [mentorship_service_1.MentorshipService],
        exports: [mentorship_service_1.MentorshipService],
    })
], MentorshipModule);
//# sourceMappingURL=mentorship.module.js.map