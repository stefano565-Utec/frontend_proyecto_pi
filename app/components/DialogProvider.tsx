import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context';

type DialogType = 'alert' | 'confirm';

type DialogContextType = {
  showAlert: (title: string, message?: string) => Promise<void>;
  showConfirm: (title: string, message?: string) => Promise<boolean>;
};

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
};

export const DialogProvider = ({ children }: { children: ReactNode }) => {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [type, setType] = useState<DialogType>('alert');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [resolver, setResolver] = useState<((value: any) => void) | null>(null);

  const showAlert = (t: string, m?: string) => {
    return new Promise<void>((resolve) => {
      setType('alert');
      setTitle(t);
      setMessage(m);
      setResolver(() => resolve);
      setVisible(true);
    });
  };

  const showConfirm = (t: string, m?: string) => {
    return new Promise<boolean>((resolve) => {
      setType('confirm');
      setTitle(t);
      setMessage(m);
      setResolver(() => resolve);
      setVisible(true);
    });
  };

  const close = (result?: boolean) => {
    setVisible(false);
    if (resolver) {
      resolver(result);
    }
    setResolver(null);
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      <Modal visible={visible} transparent animationType="fade">
        <View style={[styles.backdrop, { zIndex: 9999 }]}> 
          <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border, zIndex: 10000 }]}> 
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text> : null}

            <View style={styles.actions}>
              {type === 'confirm' && (
                <TouchableOpacity onPress={() => close(false)} style={[styles.button, { borderColor: colors.border }]}> 
                  <Text style={{ color: colors.text }}>No</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => close(type === 'confirm' ? true : undefined)} style={[styles.buttonPrimary, { backgroundColor: colors.primary }]}> 
                <Text style={{ color: colors.text }}>{type === 'confirm' ? 'Sí' : 'OK'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </DialogContext.Provider>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    zIndex: 10000,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
  },
  buttonPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 8,
  },
});

export default DialogProvider;
