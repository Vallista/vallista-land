import { Theme, SerializedStyles } from '@emotion/react';
import * as React from 'react';
export declare type WithThemeStyleProps<T> = {
    theme: Theme;
} & T;
export declare type StyleShape<T> = (props: WithThemeStyleProps<T>) => string | SerializedStyles;
export declare type SerializedCustomRecord<T extends string | number | symbol> = Record<T, SerializedStyles>;
export declare const Colors: {
    readonly PRIMARY: {
        readonly BACKGROUND: "#ffffff";
        readonly ACCENT_1: "#FAFAFA";
        readonly ACCENT_2: "#EAEAEA";
        readonly ACCENT_3: "#999";
        readonly ACCENT_4: "#888";
        readonly ACCENT_5: "#666";
        readonly ACCENT_6: "#444";
        readonly ACCENT_7: "#333";
        readonly ACCENT_8: "#111";
        readonly FOREGROUND: "#000";
    };
    readonly ERROR: {
        readonly LIGHTER: "#F7D4D6";
        readonly LIGHT: "#FF1A1A";
        readonly DEFAULT: "#E00";
        readonly DARK: "#C50000";
    };
    readonly SUCCESS: {
        readonly LIGHTER: "#D3E5FF";
        readonly LIGHT: "#3291FF";
        readonly DEFAULT: "#0070F3";
        readonly DARK: "#0761D1";
    };
    readonly WARNING: {
        readonly LIGHTER: "#FFEFCF";
        readonly LIGHT: "#F7B955";
        readonly DEFAULT: "#F5A623";
        readonly DARK: "#AB570A";
    };
    readonly VIOLET: {
        readonly LIGHTER: "#D8CCF1";
        readonly LIGHT: "#8A63D2";
        readonly DEFAULT: "#7928CA";
        readonly DARK: "#4C2889";
    };
    readonly CYAN: {
        readonly LIGHTER: "#AAFFEC";
        readonly LIGHT: "#79FFE1";
        readonly DEFAULT: "#50E3C2";
        readonly DARK: "#29BC9B";
    };
    readonly HIGHLIGHT: {
        readonly PURPLE: "#F81CE5";
        readonly MAGENTA: "#EB367F";
        readonly PINK: "#FF0080";
        readonly YELLOW: "#FFF500";
    };
};
export declare const Layers: {
    readonly BACKGROUND: -1;
    readonly STANDARD: 0;
    readonly FOREGROUND: 100;
    readonly DIALOG: 1000;
    readonly LOADING: 2000;
    readonly SNACKBAR: 3000;
    readonly CONCEAL: 9999;
};
export interface BaseTheme {
    colors: typeof Colors;
    layers: typeof Layers;
}
export declare const ThemeProvider: React.FC;
//# sourceMappingURL=index.d.ts.map