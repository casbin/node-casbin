import React, { useEffect, useState } from "react";
import { newEnforcer, Model, MemoryAdapter } from 'casbin-core';

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

const Enforcer = ( { sub, obj, act } ) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(false);
    const [enforcer, setEnforcer] = useState(null);

    useEffect(() => {
        console.log("Enforcer useEffect");
        newEnforcer(model, adapter).then(e => {
            setEnforcer(e);
        });
    }, []);

    useEffect(() => {
        if (enforcer) {
            setLoading(true);
            enforcer.enforce(sub, obj, act).then((res) => setResult(res)).finally(() => setLoading(false));
        }
    }, [sub, obj, act, enforcer]);
    return (
        <>
            <h1>Casbin</h1>
            <h2>Request ({sub}, {obj}, {act})</h2>
            {
                loading ?
                    <h3>Enforcing...</h3>
                    :
                    <h3 data-testid="enforce-result">{ result === true ? "Allowed" : "Denied" }</h3>
            }
        </>
    );
}

export default Enforcer;
