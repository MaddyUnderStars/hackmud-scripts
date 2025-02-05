
export const makeBotnetCheckinId = (user: string) => `botnet_checkin_${user}`;
export const makeBotnetLogId = (user: string, job: string) => `botnet_log_${user}_${job}_${Date.now()}`;
