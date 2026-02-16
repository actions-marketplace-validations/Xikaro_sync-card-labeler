import type { ConfigType } from '../types';
export declare class ConfigParser {
    static parse(rawConfig: any): ConfigType;
    private static parseProjectConfig;
    private static parseViews;
    private static parseViewColumns;
    private static parseSyncDirections;
    static isLegacyFormat(config: ConfigType): boolean;
    static migrateLegacyConfig(legacyConfig: ConfigType): ConfigType;
    private static extractColumnsFromLegacy;
    static validateConfig(config: ConfigType): {
        valid: boolean;
        errors: string[];
    };
}
