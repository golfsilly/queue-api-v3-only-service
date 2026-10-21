-- สร้างโดย prisma migrate diff จาก prisma/schema.prisma (โครงสร้างเดียวกับตารางจริง) ใช้กับฐานจำลองเท่านั้น
SET NAMES utf8mb4;
CREATE DATABASE hos CHARACTER SET tis620 COLLATE tis620_thai_ci;
CREATE DATABASE webaranhos CHARACTER SET utf8mb4;
USE webaranhos;
-- CreateTable
CREATE TABLE `queueService` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `hn` VARCHAR(191) NOT NULL,
    `vn` VARCHAR(191) NOT NULL,
    `display_text` VARCHAR(191) NULL,
    `oqueue` INTEGER NOT NULL,
    `main_dep_queue` INTEGER NULL,
    `cur_dep` VARCHAR(191) NULL,
    `main_dep` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,
    `vstdate` VARCHAR(191) NOT NULL,
    `confirm_all` VARCHAR(191) NULL,
    `lab_count` INTEGER NULL,
    `report_count` INTEGER NULL,
    `read_status` VARCHAR(191) NULL,
    `pname` VARCHAR(191) NOT NULL,
    `fname` VARCHAR(191) NOT NULL,
    `lname` VARCHAR(191) NOT NULL,
    `pttype_check` VARCHAR(191) NULL,
    `cur_users_id` INTEGER NULL,
    `stay` BOOLEAN NULL DEFAULT false,
    `status_call` ENUM('wait', 'stay', 'calling', 'success') NULL DEFAULT 'wait',
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    INDEX `queueService_cur_users_id_fkey`(`cur_users_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `queueUsers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `fullname` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `queueListCallnameDepartment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `depcode` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `queueService` ADD CONSTRAINT `queueService_cur_users_id_fkey` FOREIGN KEY (`cur_users_id`) REFERENCES `queueUsers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

