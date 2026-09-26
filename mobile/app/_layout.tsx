import React from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0a0e14',
          },
          headerTintColor: '#00e676',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
          contentStyle: {
            backgroundColor: '#05070a',
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'HABIT//PULSE',
          }}
        />
        <Stack.Screen
          name="add"
          options={{
            title: 'NEW PROTOCOL',
            presentation: 'modal',
            headerTintColor: '#00e5ff',
          }}
        />
      </Stack>
    </>
  )
}
