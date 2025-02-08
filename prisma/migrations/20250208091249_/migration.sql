/*
  Warnings:

  - You are about to alter the column `volume` on the `Material` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - Added the required column `acc1At` to the `DataSpp` table without a default value. This is not possible if the table is not empty.
  - Added the required column `acc2At` to the `DataSpp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `DataSpp` ADD COLUMN `acc1At` DATETIME(3) NOT NULL,
    ADD COLUMN `acc2At` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `Material` MODIFY `volume` INTEGER NOT NULL;
