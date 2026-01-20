import {
  satoshisToBTC,
  btcToSatoshis,
  formatBTC,
  formatBTCCompact,
  formatSatoshis,
  formatUSD,
  formatAddress,
  formatTimestamp,
  formatRelativeTime,
  formatPercentage,
  parseBTCToSatoshis,
  isValidBTCAmount,
} from '../../src/utils/format';

describe('Format Utils', () => {
  describe('satoshisToBTC', () => {
    it('should convert satoshis to BTC', () => {
      expect(satoshisToBTC(100000000)).toBe(1);
      expect(satoshisToBTC(50000000)).toBe(0.5);
      expect(satoshisToBTC(1)).toBe(0.00000001);
    });
  });

  describe('btcToSatoshis', () => {
    it('should convert BTC to satoshis', () => {
      expect(btcToSatoshis(1)).toBe(100000000);
      expect(btcToSatoshis(0.5)).toBe(50000000);
      expect(btcToSatoshis(0.00000001)).toBe(1);
    });
  });

  describe('formatBTC', () => {
    it('should format satoshis as BTC string', () => {
      expect(formatBTC(100000000)).toBe('1.00000000');
      expect(formatBTC(625000)).toBe('0.00625000');
    });
  });

  describe('formatBTCCompact', () => {
    it('should format satoshis as compact BTC', () => {
      expect(formatBTCCompact(100000000)).toBe('1');
      expect(formatBTCCompact(0)).toBe('0');
    });
  });

  describe('formatSatoshis', () => {
    it('should format satoshis with commas', () => {
      expect(formatSatoshis(1000000)).toBe('1,000,000');
    });
  });

  describe('formatUSD', () => {
    it('should format USD amount', () => {
      expect(formatUSD(1234.56)).toBe('$1,234.56');
    });
  });

  describe('formatAddress', () => {
    it('should truncate address', () => {
      const address = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
      expect(formatAddress(address, 8)).toBe('bc1qar0s...5l643lyd');
    });

    it('should return empty string for empty address', () => {
      expect(formatAddress('')).toBe('');
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp to readable date', () => {
      const timestamp = new Date('2024-01-15T12:00:00Z').getTime();
      const formatted = formatTimestamp(timestamp);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "Just now" for recent timestamps', () => {
      expect(formatRelativeTime(Date.now())).toBe('Just now');
    });

    it('should return minutes ago', () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
    });
  });

  describe('formatPercentage', () => {
    it('should format positive percentage', () => {
      expect(formatPercentage(5.5)).toBe('+5.50%');
    });

    it('should format negative percentage', () => {
      expect(formatPercentage(-3.2)).toBe('-3.20%');
    });
  });

  describe('parseBTCToSatoshis', () => {
    it('should parse BTC string to satoshis', () => {
      expect(parseBTCToSatoshis('1')).toBe(100000000);
      expect(parseBTCToSatoshis('0.5')).toBe(50000000);
    });

    it('should return 0 for invalid input', () => {
      expect(parseBTCToSatoshis('invalid')).toBe(0);
    });
  });

  describe('isValidBTCAmount', () => {
    it('should return true for valid amounts', () => {
      expect(isValidBTCAmount('1')).toBe(true);
      expect(isValidBTCAmount('0.00000001')).toBe(true);
    });

    it('should return false for invalid amounts', () => {
      expect(isValidBTCAmount('')).toBe(false);
      expect(isValidBTCAmount('-1')).toBe(false);
      expect(isValidBTCAmount('0.000000001')).toBe(false); // Too many decimals
    });
  });
});
