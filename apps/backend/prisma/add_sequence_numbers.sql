-- Step 1: Add donationNumber to Donation table
ALTER TABLE `Donation` ADD COLUMN `donationNumber` INT NULL;

-- Populate existing rows with sequential numbers based on createdAt order
SET @n = 0;
UPDATE `Donation` SET `donationNumber` = (@n := @n + 1) ORDER BY `createdAt` ASC;

-- Make it NOT NULL, AUTO_INCREMENT and add UNIQUE index
ALTER TABLE `Donation` MODIFY COLUMN `donationNumber` INT NOT NULL AUTO_INCREMENT, ADD UNIQUE KEY `Donation_donationNumber_key` (`donationNumber`);

-- Step 2: Add requestNumber to DonationRequest table
ALTER TABLE `DonationRequest` ADD COLUMN `requestNumber` INT NULL;

-- Populate existing rows
SET @m = 0;
UPDATE `DonationRequest` SET `requestNumber` = (@m := @m + 1) ORDER BY `createdAt` ASC;

-- Make it NOT NULL, AUTO_INCREMENT and add UNIQUE index
ALTER TABLE `DonationRequest` MODIFY COLUMN `requestNumber` INT NOT NULL AUTO_INCREMENT, ADD UNIQUE KEY `DonationRequest_requestNumber_key` (`requestNumber`);
