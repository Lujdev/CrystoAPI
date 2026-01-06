import { Exchange, ExchangeType } from '../../modules/exchanges/entities/exchange.entity';
import { AppDataSource } from '../data-source';

async function seed() {
  const dataSource = await AppDataSource.initialize();

  const exchangeRepo = dataSource.getRepository(Exchange);

  const exchanges = [
    {
      code: 'BCV',
      name: 'Banco Central de Venezuela',
      type: ExchangeType.FIAT,
      description: 'Official rate from BCV',
      website: 'https://www.bcv.org.ve',
      is_active: true,
      update_interval_seconds: 3600,
    },
    {
      code: 'BINANCE_P2P',
      name: 'Binance P2P',
      type: ExchangeType.CRYPTO,
      description: 'USDT/VES P2P Market',
      website: 'https://p2p.binance.com',
      is_active: true,
      update_interval_seconds: 3600,
    },
    {
      code: 'ITALCAMBIOS',
      name: 'Italcambios',
      type: ExchangeType.FIAT,
      description: 'Casa de cambio oficial',
      website: 'https://www.italcambio.com',
      is_active: true,
      update_interval_seconds: 3600,
    },
  ];

  for (const exchangeData of exchanges) {
    const exists = await exchangeRepo.findOneBy({ code: exchangeData.code });
    if (!exists) {
      await exchangeRepo.save(exchangeData);
      console.log(`✅ Exchange ${exchangeData.code} created`);
    } else {
      console.log(`ℹ️ Exchange ${exchangeData.code} already exists`);
    }
  }

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('❌ Error seeding data:', error);
  process.exit(1);
});
