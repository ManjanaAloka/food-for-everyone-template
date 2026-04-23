-- AlterTable
ALTER TABLE `DonationRequest` ADD COLUMN `closesAt` DATETIME(3) NULL,
    ADD COLUMN `donorCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `listingId` VARCHAR(191) NULL,
    ADD COLUMN `raisedAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `targetAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    MODIFY `targetQty` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `Donation` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `donationRequestId` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `stripeSessionId` VARCHAR(191) NULL,
    `stripePaymentId` VARCHAR(191) NULL,
    `status` ENUM('INITIATED', 'SUCCEEDED', 'FAILED', 'CANCELED', 'REFUNDED') NOT NULL DEFAULT 'INITIATED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Donation_donationRequestId_idx`(`donationRequestId`),
    INDEX `Donation_customerId_idx`(`customerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DonationRequest` ADD CONSTRAINT `DonationRequest_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `Listing`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Donation` ADD CONSTRAINT `Donation_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Donation` ADD CONSTRAINT `Donation_donationRequestId_fkey` FOREIGN KEY (`donationRequestId`) REFERENCES `DonationRequest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
