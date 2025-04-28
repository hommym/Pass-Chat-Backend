"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelPermissionDto = exports.GroupPermissionsDto = void 0;
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class GroupPermissionsDto {
}
exports.GroupPermissionsDto = GroupPermissionsDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], GroupPermissionsDto.prototype, "communityId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsEnum)(client_1.CommunityPermissionsLevels),
    __metadata("design:type", String)
], GroupPermissionsDto.prototype, "messaging", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsEnum)(client_1.CommunityPermissionsLevels),
    __metadata("design:type", String)
], GroupPermissionsDto.prototype, "mediaSharing", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsEnum)(client_1.CommunityPermissionsLevels),
    __metadata("design:type", String)
], GroupPermissionsDto.prototype, "communitySharing", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsEnum)(client_1.CommunityPermissionsLevels),
    __metadata("design:type", String)
], GroupPermissionsDto.prototype, "polls", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsEnum)(client_1.CommunityPermissionsLevels),
    __metadata("design:type", String)
], GroupPermissionsDto.prototype, "pinning", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], GroupPermissionsDto.prototype, "prevMessage", void 0);
class ChannelPermissionDto {
}
exports.ChannelPermissionDto = ChannelPermissionDto;
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], ChannelPermissionDto.prototype, "communityId", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsEnum)(client_1.CommunityPermissionsLevels),
    __metadata("design:type", String)
], ChannelPermissionDto.prototype, "commenting", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_validator_1.IsEnum)(client_1.CommunityPermissionsLevels),
    __metadata("design:type", String)
], ChannelPermissionDto.prototype, "communitySharing", void 0);
