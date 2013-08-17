(ns screenpop.cors
  "Ring middleware for Cross-Origin Resource Sharing."
  (:use [clojure.string :only (capitalize join split lower-case upper-case)]))

(defn origin
  "Returns the Origin request header."
  [request] (get (:headers request) "origin"))

(defn allow-request?
  "Returns true if the request's origin matches the access control
  origin, otherwise false."
  [request access-control]
  (let [origin          (origin request)
        allowed-origins (:access-control-allow-origin access-control)
        allowed-methods (:access-control-allow-methods access-control)]
    (if (and origin
             (seq allowed-origins)
             (seq allowed-methods)
             (some #(re-matches % origin) allowed-origins)
             ((:request-method request) allowed-methods))
      true false)))

(defn header-name
  "Returns the capitalized header name as a string."
  [header] (if header (join "-" (map capitalize (split (name header) #"-")))))

(defn normalize-headers
  "Normalize the headers by converting them to capitalized strings."
  [headers]
  (reduce (fn [acc [k v]] (assoc acc (header-name k) (if (set? v)
                                                       (join ", " (map (comp upper-case name) v))
                                                       v)))
          {}
          headers))

(defn add-access-control
  "Add the access control headers using the request's origin to the response."
  [request response access-control]
  (if-let [origin (origin request)]
    (let [access-headers (normalize-headers (assoc access-control :access-control-allow-origin origin))]
      (update-in response [:headers] merge access-headers))
    response))

(defn wrap-cors
  "Middleware that adds Cross-Origin Resource Sharing headers.

  (def handler
    (-> routes
        (wrap-cors
         :access-control-allow-origin #\"http://example.com\"
         :access-control-allow-methods [:get :put :post :delete])))
"
  [handler & access-control]
  (let [access-control (-> (apply hash-map access-control)
                           (update-in [:access-control-allow-methods] set)
                           (update-in [:access-control-allow-origin] #(if (sequential? %) % [%])))]
    (fn [request]
      (if (and (= :options (:request-method request))
               (allow-request? (assoc request :request-method (keyword (lower-case (get (:headers request) "access-control-request-method"))))
                               access-control))
        {:status 200
         :headers (normalize-headers (assoc access-control :access-control-allow-origin (get (:headers request) "origin")))
         :body "preflight complete"}
        (if (origin request)
          (when (allow-request? request access-control)
            (add-access-control request (handler request) access-control))
          (handler request))))))