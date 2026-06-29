import { Font, StyleSheet, Document, Page, Text, View } from '@react-pdf/renderer';

// 1. Register Hind Siliguri
Font.register({
  family: 'Hind Siliguri',
  fonts: [
    { src: 'https://github.com/googlefonts/hind-siliguri/raw/master/fonts/ttf/HindSiliguri-Regular.ttf', fontWeight: 'normal' },
    { src: 'https://github.com/googlefonts/hind-siliguri/raw/master/fonts/ttf/HindSiliguri-Medium.ttf', fontWeight: 500 },
    { src: 'https://github.com/googlefonts/hind-siliguri/raw/master/fonts/ttf/HindSiliguri-Bold.ttf', fontWeight: 'bold' },
  ]
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Hind Siliguri',
    padding: 40,
    backgroundColor: '#ffffff',
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: '2pt solid #3B6D11',
    paddingBottom: 20,
  },
  businessInfo: {
    textAlign: 'left',
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B6D11',
    marginBottom: 4,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#1A1A18',
  },
  clientSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  clientDetails: {
    textAlign: 'left',
  },
  clientLabel: {
    fontSize: 10,
    color: '#5F5E5A',
    marginBottom: 2,
  },
  clientValue: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  col1: { width: '50%', padding: 8 },
  col2: { width: '20%', padding: 8, textAlign: 'center' },
  col3: { width: '15%', padding: 8, textAlign: 'right' },
  col4: { width: '15%', padding: 8, textAlign: 'right' },
  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
  },
  totalBox: {
    width: 200,
    textAlign: 'right',
    spaceY: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  grandTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B6D11',
    borderTop: '1pt solid #E5E7EB',
    paddingTop: 8,
    marginTop: 8,
  },
  footer: {
    marginTop: 40,
    textAlign: 'center',
    color: '#5F5E5A',
    fontSize: 10,
    borderTop: '1pt solid #E5E7EB',
    paddingTop: 20,
  },
  paymentInfo: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 1.6,
  }
});

export default function InvoiceTemplate({ data }: { data: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{data.business.name}</Text>
            <Text>{data.business.address}</Text>
            <Text>ফোন: {data.business.phone}</Text>
          </View>
          <Text style={styles.invoiceTitle}>ইনভয়েস</Text>
        </View>

        <View style={styles.clientSection}>
          <View style={styles.clientDetails}>
            <Text style={styles.clientLabel}>বিল করা হয়েছে:</Text>
            <Text style={styles.clientValue}>{data.client?.name || 'সাধারণ কাস্টমার'}</Text>
            <Text style={styles.clientLabel}>ঠিকানা:</Text>
            <Text style={styles.clientValue}>{data.client?.address || 'N/A'}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={styles.clientLabel}>ইনভয়েস নং:</Text>
            <Text style={styles.clientValue}>{data.invoice.invoice_number}</Text>
            <Text style={styles.clientLabel}>তারিখ:</Text>
            <Text style={styles.clientValue}>{data.invoice.issue_date}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>বিবরণ</Text>
            <Text style={styles.col2}>পরিমাণ</Text>
            <Text style={styles.col3}>মূল্য</Text>
            <Text style={styles.col4}>মোট</Text>
          </View>
          {data.items.map((item: any, idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.col1}>{item.description}</Text>
              <Text style={styles.col2}>{item.qty}</Text>
              <Text style={styles.col3}>৳{item.unit_price}</Text>
              <Text style={styles.col4}>৳{item.total}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsSection}>
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text>সাবটোটাল:</Text>
              <Text>৳{data.invoice.subtotal}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>ডিসকাউন্ট:</Text>
              <Text>৳{data.invoice.discount}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={{ fontWeight: 'bold' }}>মোট টাকা:</Text>
              <Text style={{ fontWeight: 'bold' }}>৳{data.invoice.total}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text>বকেয়া টাকা:</Text>
              <Text>৳{data.invoice.due_amount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.paymentInfo}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>পেমেন্ট পদ্ধতি</Text>
          <Text>বিকাশ: {data.business.bkash_number} | নগদ: {data.business.nagad_number} | রকেট: {data.business.rocket_number}</Text>
        </View>

        <View style={styles.footer}>
          <Text>ধন্যবাদ, আমাদের সাথে থাকার জন্য!</Text>
        </View>
      </Page>
    </Document>
  );
}
