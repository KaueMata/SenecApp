import { Text, View, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    // View com fundo branco forçado
    <View style={styles.container}>
      <Text style={styles.texto}>
        Minha ideia de app começa aqui! 🚀
      </Text>
      <Text style={styles.subtitulo}>
        A tela não está mais preta.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Branco
    justifyContent: 'center',
    alignItems: 'center',
  },
  texto: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000', // Preto
  },
  subtitulo: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});