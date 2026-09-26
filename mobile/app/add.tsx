import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'

export default function AddHabitScreen() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')
  const [targetStreak, setTargetStreak] = useState('7')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a habit protocol name.')
      return
    }

    setSaving(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id

      if (userId) {
        await supabase.from('habits').insert({
          user_id: userId,
          name: name.trim(),
          description: description.trim(),
          frequency,
          target_streak: parseInt(targetStreak, 10) || 7,
        })
      }
      router.back()
    } catch {
      // Return gracefully even if unauthenticated
      router.back()
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>PROTOCOL NAME *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Morning Cold Plunge"
            placeholderTextColor="#475569"
            value={name}
            onChangeText={setName}
            autoFocus
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>DIRECTIVE / DESCRIPTION</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Why this protocol exists and rules to adhere to"
            placeholderTextColor="#475569"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>FREQUENCY</Text>
          <View style={styles.segmentedControl}>
            <Pressable
              style={[
                styles.segmentButton,
                frequency === 'daily' && styles.segmentButtonActive,
              ]}
              onPress={() => setFrequency('daily')}
            >
              <Text
                style={[
                  styles.segmentText,
                  frequency === 'daily' && styles.segmentTextActive,
                ]}
              >
                DAILY
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segmentButton,
                frequency === 'weekly' && styles.segmentButtonActive,
              ]}
              onPress={() => setFrequency('weekly')}
            >
              <Text
                style={[
                  styles.segmentText,
                  frequency === 'weekly' && styles.segmentTextActive,
                ]}
              >
                WEEKLY
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>TARGET STREAK GOAL (DAYS)</Text>
          <TextInput
            style={styles.input}
            placeholder="7"
            placeholderTextColor="#475569"
            value={targetStreak}
            onChangeText={setTargetStreak}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.submitButton, saving && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            <Text style={styles.submitButtonText}>
              {saving ? 'INITIALIZING PROTOCOL...' : 'ACTIVATE PROTOCOL'}
            </Text>
          </Pressable>

          <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>CANCEL</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070a',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
    color: '#00e5ff',
  },
  input: {
    backgroundColor: '#0a0e14',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#0a0e14',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#121824',
    borderWidth: 1,
    borderColor: '#00e676',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
  },
  segmentTextActive: {
    color: '#00e676',
  },
  actions: {
    marginTop: 16,
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#00e676',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#05070a',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
})
