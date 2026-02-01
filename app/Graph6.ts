export default class Graph6 {
    public static parse(matrix: number[][]): string {
        const n = matrix.length;
        let x = '';

        for (let column = 1; column < n; column++) {
            for (let line = 0; line < column; line++) {
                x += matrix[line][column];
            }
        }

        const graph6 = this.charCodesToSymbols(this.N(n) + ' ' + this.R(x));

        return graph6;
    };

    public static toMatrix(graph6: string): number[][] {
        const charCodes = this.symbolsToCharCodes(graph6);
        const charCodesVector = charCodes.split(' ');
        let charCodesOfN = '';
        let charCodesOfX = '';

        if (!graph6 || typeof graph6 !== "string" || graph6.length === 0) {
            throw new Error("Invalid graph6 input");
}

        if (charCodesVector[0] === '126') {
            if (charCodesVector[1] === '126') {
                [charCodesOfN, charCodesOfX] = charCodes.split(/^126\s126\s((?:\d+\s){6})/g).filter(value => Boolean(value)).map(value => value.trim());
            } else {
                [charCodesOfN, charCodesOfX] = charCodes.split(/^126\s((?:\d+\s){3})/g).filter(value => Boolean(value)).map(value => value.trim());
            }
        } else {
            [charCodesOfN, charCodesOfX] = charCodes.split(/^((?:\d+\s))/g).filter(value => Boolean(value)).map(value => value.trim());
        }

        const n = this.N_inverse(charCodesOfN);

        if (!Number.isInteger(n) || n < 0 || n > 10_000) {
            throw new Error(`Invalid graph size: ${n}`);
        }
        const x = this.R_inverse(charCodesOfX);

        const matrix = Array.from({ length: n }, () => Array(n).fill(0));

        let counter = 0;
        for (let column = 1; column < n; column++) {
            for (let line = 0; line < column; line++) {
                matrix[line][column] = Number.parseInt(x.charAt(counter));
                counter++;
            }
        }

        return matrix;
    };
    
    private static R(x: string): string {
        let charCodes = '';
        const bitVector = (x.length % 6 === 0) ? x : x.padEnd(x.length + (6 - x.length % 6), '0');
    
        for (let i = 0; i < bitVector.length / 6; i++) {
            const bits = bitVector.slice(6 * i, 6 * (i + 1));
            const charCode = String(Number.parseInt(bits, 2) + 63);
            charCodes += ' '.concat(charCode);
        }
    
        charCodes = charCodes.trim();
    
        return charCodes;
    };
    
    private static N(n: number): string {
        let charCodes = '';
    
        if (0 <= n && n <= 62) {
            charCodes = Number(n + 63).toString();
        } else if (63 <= n && n <= 258047) {
            //charCodes = '126 ' + this.R(Number(n).toString(2));
            charCodes = '126 ' + this.R(n.toString(2).padStart(18, '0'));
        } else if (258048 <= n && n <= 68719476735) {
            //charCodes = '126 126 ' + this.R(Number(n).toString(2));
            charCodes = '126 126 ' + this.R(n.toString(2).padStart(36, '0'));
        }
    
        return charCodes;
    };
    
    private static R_inverse(charCodes: string): string {
        let x = '';
    
        charCodes.split(' ').forEach(charCode => {
            x += (Number(charCode) - 63).toString(2).padStart(6, '0');
        });
    
        return x;
    };
    
    private static N_inverse(charCodes: string): number {
        let n = 0;
    
        if (charCodes.split(' ').length === 1) {
            n = Number.parseInt(charCodes) - 63;
        } else {
            const x = this.R_inverse(charCodes);
            n = Number.parseInt(x, 2);
        }
    
        return n;
    };
    
    private static charCodesToSymbols(charCodes: string): string {
        const symbols = String.fromCharCode(...charCodes.split(' ').map(charCode => Number.parseInt(charCode)));
    
        return symbols;
    };
    
    private static symbolsToCharCodes(symbols: string): string {
        const charCodes = symbols.split('').map(char => (
            char.charCodeAt(0)
        )).join(' ');
    
        return charCodes;
    };
}