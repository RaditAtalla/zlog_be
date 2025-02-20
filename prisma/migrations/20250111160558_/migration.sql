-- AlterTable
ALTER TABLE `DetailSpp` ADD COLUMN `bppbId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Bppb` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `kode` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdByUserId` INTEGER NOT NULL,
    `acc2Status` ENUM('APPROVED', 'NOT_APPROVED', 'WAITING') NOT NULL DEFAULT 'WAITING',
    `acc1Status` ENUM('APPROVED', 'NOT_APPROVED', 'WAITING') NOT NULL DEFAULT 'WAITING',
    `accFinalStatus` ENUM('APPROVED', 'NOT_APPROVED', 'WAITING') NOT NULL DEFAULT 'WAITING',
    `sppStatus` ENUM('APPROVED', 'NOT_APPROVED', 'WAITING') NOT NULL DEFAULT 'WAITING',

    UNIQUE INDEX `Bppb_kode_key`(`kode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DetailBppb` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bppbId` INTEGER NOT NULL,
    `material` VARCHAR(191) NOT NULL,
    `spesifikasi` VARCHAR(191) NOT NULL,
    `volume` INTEGER NOT NULL,
    `satuan` VARCHAR(191) NOT NULL,
    `lokasiPekerjaan` VARCHAR(191) NOT NULL,
    `namaPekerja` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DetailSpp` ADD CONSTRAINT `DetailSpp_bppbId_fkey` FOREIGN KEY (`bppbId`) REFERENCES `Bppb`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bppb` ADD CONSTRAINT `Bppb_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bppb` ADD CONSTRAINT `Bppb_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DetailBppb` ADD CONSTRAINT `DetailBppb_bppbId_fkey` FOREIGN KEY (`bppbId`) REFERENCES `Bppb`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
