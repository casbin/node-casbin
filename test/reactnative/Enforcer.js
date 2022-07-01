import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { newEnforcer, Model, MemoryAdapter } from "casbin-core";

const model = new Model(`
    [request_definition]
    r = sub, obj, act
    [policy_definition]
    p = sub, obj, act
    [policy_effect]
    e = some(where (p.eft == allow))
    [matchers]
    m = r.sub == p.sub && r.obj == p.obj && r.act == p.act
    `);

const adapter = new MemoryAdapter(`
    p, alice, data1, read
    p, bob, data2, write
    `);

const Enforcer = ({ sub, obj, act }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(false);
  const [enforcer, setEnforcer] = useState(null);

  useEffect(() => {
    newEnforcer(model, adapter).then((e) => {
      setEnforcer(e);
    });
  }, []);

  useEffect(() => {
    if (enforcer) {
      setLoading(true);
      enforcer
        .enforce(sub, obj, act)
        .then((res) => setResult(res))
        .finally(() => setLoading(false));
    }
  }, [sub, obj, act, enforcer]);
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Casbin</Text>
      <Text style={styles.h2}>
        Request ({sub}, {obj}, {act})
      </Text>
      {loading ? (
        <Text>Enforcing...</Text>
      ) : (
        <Text style={styles.resultText} testID="enforce-result">
          {result === true ? "Allowed" : "Denied"}
        </Text>
      )}
      <StatusBar style="auto" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center'
  },
  resultText: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 20
  },
  h1: {
    padding: 20,
    fontWeight: 'bold',
    fontSize: 60
  },
  h2: {
    padding: 10,
    fontSize: 20
  }
});

export default Enforcer;
